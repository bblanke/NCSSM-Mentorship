angular.module('mentorship')
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(function($injector){
      return {
        request: function(config){
          var auth = $injector.get('auth');
          var domain = config.url.match(/\w+(?=\.com)/);
          if(domain){
            if(domain[0] === 'googleapis'){
              config.headers['Authorization'] = 'Bearer '+auth.me.googleToken;
            }
          }else{
            if(auth.token){
              config.headers['Authorization'] = 'Bearer '+auth.token;
            }
          }
          return config;
        }
      };
    });
  }]);
