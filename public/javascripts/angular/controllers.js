angular.module('mentorship')
  .controller('PageController', ['$scope', 'socket', 'auth', function($scope, socket, auth){
    $scope.colorBg = false;
  }])
  .controller('AccountCtrl', ['$scope', 'socket','auth', function($scope,socket,auth){
    $scope.$parent.colorBg = true;
    var authWindow;
    var socketId;
    var clientId = '115445966511-ogupss8jo9f6o75egqe5lo4tlvnmmrab.apps.googleusercontent.com';
    $scope.registerUser = function(){
      auth.register({
        givenName: $scope.givenName,
        preferredName: $scope.preferredName,
        email: $scope.email,
        phone: $scope.phone,
        class: $scope.class,
        address: $scope.address,
        type: $scope.class,
        birthdate: $scope.birthdate,
        googleId: $scope.googleId,
        image: $scope.image
      });
    }
    $scope.openGoogle = function(){
      authWindow = window.open('https://accounts.google.com/o/oauth2/auth?scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fusers%2FgoogleCb&response_type=code&client_id=' + clientId + '&approval_prompt=auto&state=' + socketId);
    };
    socket.on('socketcreds', function(data){
      socketId = data;
    });
    socket.on('userdata', function(data){
      $scope.givenName = data.firstName + ' ' + data.lastName;
      $scope.preferredName = data.displayName;
      $scope.email = data.email;
      $scope.class = "20" + data.email.match(/\d{2}/);
      $scope.googleId = data.googleId;
      $scope.dataArrived=true;
      $scope.image = data.image;
      console.log('userdata received');
      authWindow.close();
    });
    socket.on('authPackage', function(data){
      auth.setToken(data);
      console.log('authpackage received');
      authWindow.close();
    });
  }])
  .controller('DashCtrl', ['$scope', 'socket', '$mdSidenav', '$state', 'auth', function($scope,socket, $mdSidenav, $state, auth){
    $scope.pageTitle = "Joke's on you; this is gonna be a page.";
    $scope.$parent.colorBg = false;
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
  }]);
