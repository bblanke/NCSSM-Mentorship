angular.module('mentorship')
  .controller('AppCtrl', ['$scope', 'socket', 'auth','$http', function($scope, socket, auth, $http){
    $scope.colorBg = false;

    socket.on('socketcreds', function(data){
      console.log('got socket creds');
      auth.socketID = data;
      $http.defaults.headers.common['X-Socket'] = data;
    });
  }])
  .controller('AccountCtrl', ['$scope', 'socket','auth', '$http', function($scope,socket,auth,$http){
    $scope.$parent.colorBg = true;
    var authWindow;
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
      authWindow = window.open('https://accounts.google.com/o/oauth2/auth?scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive%20https%3A%2F%2Fspreadsheets.google.com%2Ffeeds&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fusers%2FgoogleCB&response_type=code&client_id=' + clientId + '&approval_prompt=auto&state=' + auth.socketID);
    };
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
  .controller('UsersCtrl', ['$scope','users', '$mdDialog', function($scope,users, $mdDialog){
    $scope.users = users;
    $scope.$parent.pageTitle = "Users"
    $scope.removeUser = function(user, ev){
      var confirm = $mdDialog.confirm()
        .title('Are you sure you want to delete '+user.preferredName+' ?')
        .content('Forever is a pretty long time.')
        .ariaLabel('Delete user %s', user.preferredName)
        .ok('Yep')
        .cancel('Nope')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function(){
        users.delete(user);
      });
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
  .controller('ImportCtrl', ['$scope','$http','papa','$mdDialog','$state', function($scope,$http,papa,$mdDialog,$state){
    $scope.$parent.pageTitle = "Import Data";
    $scope.cardTitle = 'Select Spreadsheet';
    $scope.spreadsheets = [];
    $scope.dataLoading = true;
    $scope.sheetDataRetrieved = false;
    $scope.headerDataRetrieved = false;
    var sheetUrl;
    $http.get('https://www.googleapis.com/drive/v2/files').success(function(data){
      $scope.dataLoading = false;
      $scope.sheetDataRetrieved = true;
      var filteredData = data.items.filter(function(el){
        return el.mimeType === "application/vnd.google-apps.spreadsheet";
      });
      angular.copy(filteredData, $scope.spreadsheets);
    });
    $scope.parseSpreadsheet = function(sheetID){
      $scope.sheetDataRetrieved = false;
      $scope.dataLoading = true;
      var modelData;
      $http.get('/models').success(function(data){//get the models before we do anything else
        modelData = data;
        console.log(modelData);
      });
      $http.get('https://www.googleapis.com/drive/v2/files/'+sheetID).success(function(data){//get the url
        sheetUrl = data.exportLinks['text/csv'];
        $http.get('/import', {params:{resource_url: sheetUrl}}).success(function(data){//get the csv file
          sheet = papa.parse(data, {header: true});
          if(sheet.data.length === 0){
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.body))
                .title('Spreadsheet Error')
                .content('The selected spreadsheet is not valid for import. Please make sure the sheet holds the responses to a Google Form and that there is at least one response (2 rows of data).')
                .ariaLabel('Spreadsheet Error Dialog')
                .ok('Sounds good.')
            );
            $scope.sheetDataRetrieved = true;
          }else{
            $scope.cardTitle = 'Import Settings'
            $scope.headerDataRetrieved = true;
            $scope.createNew = false;
            $scope.columns = []; //the columns of the spreadsheet that can be imported or used as keys
            $scope.model; //the model that the user wants to add data to
            $scope.models = Object.keys(modelData); //all app models to choose to add data to
            $scope.sheetKey; //the unique key on the sheet
            $scope.modelKey; //the unique key on the model
            $scope.modelData = modelData; //all of the keys for each model (basically all you can choose from)
            angular.forEach(Object.keys(sheet.data[0]), function(key,index){
              $scope.columns.push({name: key,import: false,fieldName: ''}); //////SOMETHING IS WRONG - the model keys aren't changing. this all feels very messy. there needs to be a way to make it cleaner. also I'm concerned that some of my data im sending as an index and some im sending as strings which makes server-side easier but makes code complex.
            });
          }
          $scope.dataLoading = false;
        });
      });
    }
    $scope.importSpreadsheet = function(){
      var sheetData = {
        url: sheetUrl,
        model: $scope.model,
        sheetKey: $scope.sheetKey,
        modelKey: $scope.modelKey,
        createNew: $scope.createNew,
        columns: {}
      }
      angular.forEach($scope.columns, function(column, index){
        if(column.import === true){
          sheetData.columns[$scope.columns.indexOf(column)] = column.fieldName;
        }
      });
      $scope.dataLoading = true;
      $scope.headerDataRetrieved = false;
      $http.post('/import', sheetData).success(function(data){
        $scope.dataLoading = false;
        $mdDialog.show(
          $mdDialog.alert()
            .parent(angular.element(document.body))
            .title('Success')
            .content('Data was successfully imported')
            .ariaLabel('Success message')
            .ok('Nice.')
        );
        $state.go('dashboard');
      });
    }
    $scope.createDocWarning = function(checked){
      if(!checked){
        $mdDialog.show(
          $mdDialog.alert()
            .parent(angular.element(document.body))
            .title('Caution')
            .content('Take caution when creating new documents from spreadsheets. Unless you collect comprehensive data in your spreadsheet, you may find that some features of the application behave oddly when interacting with your new documents. For instance, if you have a survey for users that collects email and favorite color, but nothing else, and there are users in the survey who are not registered with the system (so therefore new documents are created for them), important fields such as name or profilePicture will not be created with the new document, so when you do something that requires these fields, like viewing the list of all users, you will see odd results (like users without any names).')
            .ariaLabel('Spreadsheet Import Warning')
            .ok('Duly noted.')
        );
      }
    }
  }]);
