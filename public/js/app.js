angular.module('app', ['ngRoute']);

angular.module('app').config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'home.html',
      controller: 'HomeCtrl',
      controllerAs: 'home'
    })
    .when('/view1/:argument?', {
      templateUrl: 'view1.html',
      controller: 'View1Ctrl',
      controllerAs: 'view1'
    })
    .when('/view2', {
      templateUrl: 'view2.html',
      controller: 'View2Ctrl',
      controllerAs: 'view2'
    })
    .otherwise({redirectTo: '/'});
});

angular.module('app').controller('TadaCtrlMain',function($http, $scope){
  var self = this;
  self.clientCommand ='';

  self.sendAutoComplete = function() {
      $http.post("/tada/autoComplete", { "clientPartialCommand" : self.clientCommand, "clientCursorPosition" : 0 }).
        then(function(response) {
          self.autoCompleteOptions = response.data;
        });

   };

  $scope.$watch('main.clientCommand', function(newValue) {
      self.status = '';
      if(angular.isDefined(newValue) && newValue[newValue.length - 1] === ' ') {              
        self.sendAutoComplete();
      }
  });


  self.sendClientCommand = function(){
   $http.post("/tada/go", { "clientCommand" : self.clientCommand}).then(function(response){
               console.log("Success!")
               console.log(response)
              // status = parseInt(status)
               if (response.status == "200" && response.data.message == "") {
                   console.log("Flight number is : " + response.data.flightNumber);
                   self.status = "Have A Wonderful Flight , Your Flight number is : " + response.data.flightNumber
                }

    
 },function(response){

 });
  };

  self.onFocus = function() {     
    if(self.clientCommand.length === 0) {      
      self.sendAutoComplete();
    }
  };
});

   