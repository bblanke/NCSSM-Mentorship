var mongoose = require('mongoose');
var crypto = require('crypto');
var passwords = require('../config/passwords');
var auth = require('../config/auth');

var UserSchema = new mongoose.Schema({
  givenName: String,
  preferredName: String,
  email: String,
  type: String,
  class: Number,
  address: String,
  phone: String,
  birthdate: Date,
  token: String,
  googleId: String,
  image: String
});

UserSchema.methods.generateTokens = function(googleToken, lifetime, cb){
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
  this.googleToken = token;
  this.save(cb);
  return payload;
}

UserSchema.static.decodeToken = function(payload, cb){
  var decipher = crypto.createDecipher('aes-256-cbc', passwords.secretKey);
  var tokenContainer = decipher.update(payload, 'base64', 'utf8') + decipher.final('utf8');
  tokenContainer = JSON.parse(tokenContainer);
  console.log(tokenContainer.token);
}


mongoose.model('User', UserSchema)
