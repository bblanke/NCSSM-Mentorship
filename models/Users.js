var mongoose = require('mongoose');
var crypto = require('crypto');
var passwords = require('../config/passwords');
var auth = require('../config/auth');

var UserSchema = new mongoose.Schema({
  givenName: String,
  preferredName: String,
  email: String,
  accountType: String,
  class: Number,
  address: String,
  phone: String,
  birthdate: Date,
  token: String,
  googleId: String,
  googleToken: String,
  image: String
});

UserSchema.methods.updateTokens = function(googleToken, lifetime, cb){
  var token = crypto.randomBytes(48).toString('hex');
  //lifetime is in seconds
  var now = new Date();
  var exp = now.getTime() + ((lifetime-60) * 1000);
  var tokenContainer = {
    token: token,
    exp: exp
  }
  var payload = {
    payload: auth.encrypt(JSON.stringify(tokenContainer)),
    exp: exp
  }
  this.token = token;
  this.googleToken = googleToken;
  this.save(cb);
  return payload;
}

UserSchema.static.getUserFromToken = function(payload, cb){
  tokenContainer = JSON.parse(auth.decrypt(payload));
  console.log("Token from container: " +tokenContainer.token);
}


mongoose.model('User', UserSchema)
