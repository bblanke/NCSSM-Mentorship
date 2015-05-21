var crypto = require('crypto');

var auth={
  currentUser: null
}

auth.encrypt = function(data,key){
  var cipher = crypto.createCipher('aes-256-ctr',key)
  var crypted = cipher.update(data,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

auth.decrypt = function(data,key){
  var decipher = crypto.createDecipher('aes-256-ctr',key)
  var dec = decipher.update(data,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

module.exports = auth;
