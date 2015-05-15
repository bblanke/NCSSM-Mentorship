angular.module('mentorship')
  .factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  }])
  .factory('auth', ['$http', '$window', '$state', function($http, $window, $state){
    var auth = {
      loggedIn: false,
      token: "",
      tokenExp: ""
    };
    auth.initializeToken = function(){
      //check to see if we have a valid token stored. if so, load it up and direct us to dashboard
      console.log('checking token');
      var localToken = $window.localStorage['mentorship-authPackage'];
      var authPackage;
      var now = new Date();
      if(localToken !== undefined){
        authPackage = JSON.parse(localToken);
      }
      if(authPackage && authPackage.exp > now.getTime()){
        console.log('theres a token, lets load it');
        loadToken(authPackage);
        return true;
      }else{
        console.log('no token found');
        return false;
      }
    }
    auth.verifyToken = function(){
      console.log('verifying token');
      //between pages, let's make sure our token is still valid
      var now = new Date();
      if(auth.tokenExp > now.getTime()){
        console.log('valid token');
        auth.loggedIn = true;
      }else{
        console.log('invalid token');
        auth.loggedIn = false;
      }
    }
    auth.setToken = function(authPackage){
      //set our token, store it in case we quit, and redirect us to the dashboard
      //should only be called if we don't already have a token
      $window.localStorage['mentorship-authPackage'] = JSON.stringify(authPackage);
      loadToken(authPackage);
      $state.go('dashboard');
    }
    auth.logOut = function(){
      console.log('logging out');
      $window.localStorage.removeItem('mentorship-authPackage');
      auth.token = ""; //set to empty if no longer needed
      auth.loggedIn = false;
      $window.location = '/';
    }
    var loadToken = function(authPackage){
      auth.token = authPackage.payload;
      auth.tokenExp = authPackage.exp;
      $http.defaults.headers.common.Authorization = "Bearer "+authPackage.payload;
      auth.loggedIn = true;
      console.log('user logged in');
    }
    auth.register = function(userData){
      return $http.post('/users', userData).success(function(data){
        auth.setToken(data);
      });
    }
    return auth;
  }])
  .factory('users', ['$http', 'auth', function($http, auth){
    var users = [];
    users.getAll = function(){
      return $http.get('/users').success(function(data){
        angular.copy(data, users);
      });
    }
    users.delete = function(user){
      var index = users.indexOf(user);
      return $http.delete('/users/' + user._id).success(function(data){
        users.splice(index,1);
      });
    }
    users.update = function(user){
      return $http.put('/users/' + user._id, user);
    }
    return users;
  }]);
