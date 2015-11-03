angular.module('app', ['ngRoute','ui.bootstrap']);

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

angular.module('app').controller('TadaCtrlMain',function($http){
  var self = this;
  self.clientCommand ='';
  self.autoCompleteOptions = [
    'book a flight',
    'go home'
  ];
  self.sendClientCommand = function(){
   $http.post("/tada/go", { "clientCommand" : self.clientCommand}).then (
    function(response){
      console.log("http post sent");
    });

   
  }

});
