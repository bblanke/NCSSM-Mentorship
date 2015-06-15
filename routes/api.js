var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');

var io = require('../config/io');
var passwords = require('../config/passwords');
var auth = require('../config/auth');

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

router.route('/users/googleCB')
  .get(function(req,res,next){
    var socketID = req.query.state;
    request.post({url: 'https://www.googleapis.com/oauth2/v3/token', form: {code:req.query.code,client_id:passwords.googleClient,client_secret:passwords.googleSecret,redirect_uri:'http://localhost:3000/users/googleCB',grant_type:'authorization_code'}}, function(err,response,body){
      var data = JSON.parse(body);
      var exp = data.expires_in;
      var googleToken = data.access_token;
      request('https://www.googleapis.com/plus/v1/people/me?access_token=' +googleToken, function(err,response,body){
        var userData = JSON.parse(body);
        User.findOne({ 'googleId' : userData.id}, function(err,user){
          if(err){return next(err);}
          if(user){
            console.log('user exists');
            io.to(socketID).emit('authPackage', user.updateTokens(googleToken, exp));
          }else{
            console.log('creating user');
            var data = {
              displayName: userData.displayName,
              firstName: userData.name.givenName,
              lastName: userData.name.familyName,
              email: userData.emails[0].value,
              googleId: userData.id,
              googleToken: googleToken,
              image: userData.image.url,
              exp: exp
              };
            io.to(socketID).emit('userdata', {encrypted: auth.encrypt(JSON.stringify(data),passwords.accountCreationKey),raw: data});
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
    var safeData = auth.decrypt(req.body.encrypted,passwords.accountCreationKey);
    try{
      safeData = JSON.parse(safeData);
    }catch(err){
      res.sendStatus(400);
    }
    var rawData = req.body.raw;
    var user = new User({
      preferredName: rawData.preferredName,
      givenName: safeData.givenName,
      email: safeData.email,
      phone: rawData.phone,
      class: rawData.class,
      address: rawData.address,
      accountType: rawData.accountType,
      googleId: safeData.googleId,
      image: safeData.image,
      googleToken: safeData.googleToken});
    user.save(function(err, user){
      if(err){return next(err);}
      res.json(user.updateTokens(safeData.exp));
    });
  });
router.route('/users/:user')
  .delete(function(req,res,next){
    req.user.remove(function(err, user){
      if(err){return next(err);}
      res.sendStatus(200);
    });
  })
  .put(function(req,res,next){//need to make sure only admins can set and remove admins
    req.user.update(req.body, function(err,user){
      if(err){return next(err);}
      res.sendStatus(200);
    });
  });
router.route('/users/me')
  .get(function(req,res,next){
    console.log("current user: " + req.currentUser);
    res.send(req.currentUser);
  });

router.route('/import')
  .get(function(req,res,next){ //basically a patchthrough to download csv of spreadsheet because CORS blocks client from downloading it
    console.log(req.query.resource_url);
    request.get(req.query.resource_url,{'auth':{'bearer':req.currentUser.googleToken}}, function(err,response,body){
        res.send(body);
    });
  })
  .post(function(req,res,next){
    var sheetOptions = req.body;
    var model = mongoose.model(sheetOptions.model);
    res.send("Good.");
  })
router.route('/models')
  .get(function(req,res,next){
    res.send(mongoose.modelNames());
  });

module.exports = router;


//Store refresh token
//create job manager to get new token when it expires
