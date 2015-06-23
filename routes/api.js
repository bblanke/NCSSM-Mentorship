var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');

var io = require('../config/io');
var passwords = require('../config/passwords');
var auth = require('../config/auth');

var User = mongoose.model('User');

var parse = require('csv-parse');


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
    res.send(req.currentUser);
  });

router.route('/import')
  .get(function(req,res,next){ //basically a patchthrough to download csv of spreadsheet because CORS blocks client from downloading it
    request.get(req.query.resource_url,{'auth':{'bearer':req.currentUser.googleToken}}, function(err,response,body){
        res.send(body);
    });
  })
  .post(function(req,res,next){
    var sheetOptions = req.body;
    var oModel = mongoose.model(sheetOptions.model);
    request.get(sheetOptions.url,{'auth':{'bearer':req.currentUser.googleToken}}, function(err,response,body){
      if(err){return next(err);}
      //first add to schema
      //then sort through data and find the record by the key
        //if exists, add to record
        //if not, create record based on supplied data

      //This adds new columns/keys/properties to the schema
      var schema = oModel.schema;
      for(var column in sheetOptions.columns){
        var keyName = sheetOptions.columns[column];
        if(!(Object.keys(schema.tree).indexOf(keyName) > -1)){
          var formattedKey = {};
          formattedKey[keyName] = 'string';
          schema.add(formattedKey);
        }
      }
      var nModel = mongoose.model(sheetOptions.model,schema);

      parse(body,function(err,data){
        if(err){return next(err);}
        var sKeyIndex = data[0].indexOf(sheetOptions.sheetKey);
        var mKey = sheetOptions.modelKey;

        function asyncLoop(i,callback){ //fancy business to work with async in loops
          if(i<data.length){
            var sKey = data[i][sKeyIndex];
            nModel.find().where(mKey,sKey).exec(function(err,docs){
              if(err){return next(err);}

              //get the data we want to use to update/create a record
              var columnIndexes = Object.keys(sheetOptions.columns);
              var docData = {};
              for(a=0; a<columnIndexes.length; a++){ //for each column, add to our record data object
                var columnIndex = columnIndexes[a];
                var fieldName = sheetOptions.columns[columnIndex];
                var fieldValue = data[i][columnIndex];
                docData[fieldName] = fieldValue;
              }

              if(docs.length>0){ //if a record exists, update it
                var doc = docs[0];
                doc.update(docData,{},function(err,object){ //update the record with our update data object
                  asyncLoop(i+1,callback);
                });
              }else{ //create a new record if none exists, but only if we're allowed to
                if(sheetOptions.createNew){
                  docData[mKey] = sKey;
                  nModel.create(docData, function(err,doc){
                    asyncLoop(i+1,callback);
                  });
                }else{
                  asyncLoop(i+1,callback);
                }
              }
            });
          }else{
            callback();
          }
        }
        asyncLoop(1,function(){
          nModel.find({}, function(err,records){
            res.send('good');
          });
        });
      });
    });
  });
router.route('/models')
  .get(function(req,res,next){
    var names = mongoose.modelNames();
    var models = {};
    for(i = 0; i < names.length; i++){
      var name = names[i];
      models[name] = Object.keys(mongoose.model(name).schema.paths);
    }
    res.send(models);
  });

module.exports = router;
