var express = require('express');
var router = express.Router();

/* GET VIEWS */
router.get('/account', function(req, res, next) {
  res.render('pages/account');
}).get('/home', function(req,res,next){
  res.render('pages/home');
}).get('/dashboard', function(req,res,next){
  res.render('pages/dashboard');
}).get('/users', function(req,res,next){
  res.render('pages/users');
}).get('/assignments', function(req,res,next){
  res.render('pages/assignments');
}).get('/mail', function(req,res,next){
  res.render('pages/mail');
}).get('/mentors', function(req,res,next){
  res.render('pages/mentors');
}).get('/setup', function(req,res,next){
  res.render('pages/setup');
});

module.exports = router;
