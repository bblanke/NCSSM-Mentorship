var mongoose = require('mongoose');
var crypto = require('crypto');
var passwords = require('../config/passwords');

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

mongoose.model('User', UserSchema)
