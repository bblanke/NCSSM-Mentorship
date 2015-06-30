angular.module('mentorship')
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(function($injector){
      return {
        request: function(config){
          var auth = $injector.get('auth');
          var domain = config.url.match(/\w+(?=\.com)/);
          if(domain){
            console.log("Domain: "+domain[0]);
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
  }])
  .config(function($provide){
		// this demonstrates how to register a new tool and add it to the default toolbar
		$provide.decorator('taOptions', ['$delegate', function(taOptions){ // $delegate is the taOptions we are decorating
      taOptions.toolbar = [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote', 'bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear', 'justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent', 'html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
      ];
			return taOptions;
		}]);
	});
