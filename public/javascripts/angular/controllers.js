angular.module('mentorship')
  .controller('AppCtrl', ['$scope', 'socket', 'auth', function($scope, socket, auth){
    $scope.colorBg = false;
  }])
  .controller('AccountCtrl', ['$scope', 'socket','auth', function($scope,socket,auth){
    $scope.$parent.colorBg = true;
    var authWindow;
    var socketId;
    var clientId = '115445966511-ogupss8jo9f6o75egqe5lo4tlvnmmrab.apps.googleusercontent.com';
    var encrypted;

    $scope.registerUser = function(){
      auth.register({
        encrypted,
        raw: {
          preferredName: $scope.preferredName,
          phone: $scope.phone,
          address: $scope.address,
          accountType: $scope.accountType,
          birthdate: $scope.birthdate,
          class: $scope.class
        }
      });
    }
    $scope.openGoogle = function(){
      authWindow = window.open('https://accounts.google.com/o/oauth2/auth?scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fusers%2FgoogleCb&response_type=code&client_id=' + clientId + '&approval_prompt=auto&state=' + socketId);
    };
    socket.on('socketcreds', function(data){
      socketId = data;
    });
    socket.on('userdata', function(data){
      //shift focus to register tab!
      encrypted = data.encrypted;
      var year = data.raw.email.match(/\d{2}/);
      $scope.givenName = data.raw.firstName + ' ' + data.raw.lastName;
      $scope.preferredName = data.raw.displayName;
      $scope.email = data.raw.email;
      $scope.class = year !== null ? "20" + year : null;
      $scope.dataArrived=true;
      console.log('userdata received');
      authWindow.close();
    });
    socket.on('authPackage', function(data){
      auth.setToken(data);
      console.log(data);
      console.log('authpackage received');
      authWindow.close();
    });
  }])
  .controller('DashCtrl', ['$scope', 'socket', '$mdSidenav', '$state', 'auth', function($scope,socket, $mdSidenav, $state, auth){
    $scope.pageTitle = "Joke's on you! This is gonna be a page.";
    $scope.$parent.colorBg = false;
    $scope.me = auth.me;
    $scope.openNav = function(nav){
      $mdSidenav(nav).open();
    }
    $scope.closeNav = function(nav){
      $mdSidenav(nav).close();
    }
    $scope.navigateTo = function(page){
      $state.go(page);
    }
    $scope.logOut = function(){
      auth.logOut();
    }
  }])
  .controller('UsersCtrl', ['$scope','users', function($scope,users){
    $scope.users = users;
    $scope.$parent.pageTitle = "Users"
    $scope.removeUser = function(user){
      users.delete(user);
    }
  }])
  .controller('MentorsCtrl', ['$scope', function($scope){
    $scope.$parent.pageTitle = "Mentors";
  }])
  .controller('AssignmentsCtrl', ['$scope', function($scope){
    $scope.$parent.pageTitle = "Assignments";
  }])
  .controller('MailCtrl', ['$scope', function($scope){
    $scope.$parent.pageTitle = "Mail";
  }])
  .controller('ImportCtrl', ['$scope', function($scope){
    $scope.$parent.pageTitle = "Import Data";
  }]);
