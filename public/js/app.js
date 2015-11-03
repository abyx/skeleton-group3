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
      console.log(newValue);
      if(angular.isDefined(newValue) && newValue[newValue.length - 1] === ' ') {              
        self.sendAutoComplete();
      }
  });


  self.sendClientCommand = function(){
   $http.post("/tada/go", { "clientCommand" : self.clientCommand}).then (
    function(response){
      console.log("http post sent");
    });

   
  }

});
