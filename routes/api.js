var express = require('express');
var router = express.Router();
var io = require('../config/io');
var passwords = require('../config/passwords');
var request = require('request');
var mongoose = require('mongoose');
var User = mongoose.model('User');


router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function (err, user){
    if (err) { return next(err); }
    if (!user) { return next(new Error('can\'t find user')); }

    req.user = user;
    return next();
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.route('/users/googleCb')
  .get(function(req,res,next){
    var socketId = req.query.state;
    request.post({url: 'https://www.googleapis.com/oauth2/v3/token', form: {code:req.query.code,client_id:passwords.googleClient,client_secret:passwords.googleSecret,redirect_uri:'http://localhost:3000/users/googleCb',grant_type:'authorization_code'}}, function(err,response,body){
      var exp = JSON.parse(body).expires_in;
      request('https://www.googleapis.com/plus/v1/people/me?access_token=' + JSON.parse(body).access_token, function(err,response,body){
        var userData = JSON.parse(body);
        User.findOne({ 'googleId' : userData.id}, function(err,user){
          if(err){return next(err);}
          if(user){
            console.log('user exists');
            io.to(socketId).emit('authPackage', user.generateToken(exp));
          }else{
            console.log('creating user');
            io.to(socketId).emit('userdata', {displayName: userData.displayName, firstName: userData.name.givenName, lastName: userData.name.familyName, email: userData.emails[0].value, googleId: userData.id, image: userData.image.url, exp: exp});
          }
        });
        res.sendStatus(200);
      });
    });
  });

router.route('/users')
  .get(function(req,res,next){
    User.find(function(err,users){
      if(err){ return next(err); }
      res.json(users);
    });
  })
  .post(function(req,res,next){
    var user = new User({
      preferredName: req.body.preferredName,
      givenName: req.body.givenName,
      email: req.body.email,
      phone: req.body.phone,
      class: req.body.class,
      address: req.body.address,
      type: req.body.type,
      googleId: req.body.googleId,
      image: req.body.image});
    user.save(function(err, user){
      if(err){return next(err);}
      res.json(user.generateToken(req.body.exp));
    });
  });
router.route('/users/:user')
  .delete(function(req,res,next){
    req.user.remove(function(err, user){
      if(err){return next(err);}
      res.sendStatus(200);
    });
  })
  .put(function(req,res,next){
    req.user.update(req.body, function(err,user){
      if(err){return next(err);}
      res.sendStatus(200);
    });
  });

module.exports = router;


//Store refresh token
//create job manager to get new token when it expires
