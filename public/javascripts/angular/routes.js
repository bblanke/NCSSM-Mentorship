angular.module('mentorship')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    $stateProvider
      .state('account', {
        url: '/account',
        templateUrl: 'pages/account',
        controller: 'AccountCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(auth.loggedIn){
            $state.go('dashboard');
          }else{
            if(auth.initializeToken()){
              $state.go('dashboard');
            }
          }
        }]
      })
      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'pages/dashboard',
        controller: 'DashCtrl',
        resolve:{
          mePromise: ['auth', function(auth){
            return auth.getMe();
          }]
        },
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.users', {
        url: '/users',
        templateUrl: 'pages/users',
        controller: 'UsersCtrl',
        resolve:{
          userPromise: ['users', function(users){
            return users.getAll();
          }]
        },
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.mentors', {
        url: '/mentors',
        templateUrl: 'pages/mentors',
        controller: 'MentorsCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.assignments', {
        url: '/assignments',
        templateUrl: 'pages/assignments',
        controller: 'AssignmentsCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.mail', {
        url: '/mail',
        templateUrl: 'pages/mail',
        controller: 'MailCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.setup', {
        url: '/setup',
        templateUrl: 'pages/setup',
        controller: 'SetupCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      })
      .state('dashboard.import', {
        url: '/import',
        templateUrl: 'pages/import',
        controller: 'ImportCtrl',
        onEnter: ['auth', '$state', function(auth, $state){
          if(!auth.loggedIn){
            $state.go('account');
          }
        }]
      });
    $urlRouterProvider.otherwise('account');
  }]);
