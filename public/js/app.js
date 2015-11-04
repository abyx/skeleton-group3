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

angular.module('app').controller('TadaCtrlMain',function($http, $scope){
  var self = this;
  self.clientCommand ='';   

  self.sendAutoComplete =  function(newValue) {
      self.status = '';
      var words = [];
      if (newValue != null && newValue.length > 0) 
        {
          words = newValue.replace(/\s{2,}/g, ' ').split(' ');
          console.log(words);
        };
      console.log((angular.isDefined(newValue) && newValue[newValue.length - 1] === ' ') || (words.length > 0 && (words[words.length-2] == 'from' || words[words.length-2] == 'to')),words[words.length-2]);
      if((angular.isDefined(newValue) && newValue[newValue.length - 1] === ' ') || (words.length > 0 && (words[words.length-2] == 'from' || words[words.length-2] == 'to'))) {
        if (words.length > 0 && (words[words.length-2] == 'from' || words[words.length-2] == 'to')) 
          {
            console.log('from or to')
            return $http.post("/tada/autoCompleteLocations", { "clientPartialCommand" : newValue.replace(/\s{2,}/g, ' '), "clientCursorPosition" : 0 }).
            then(function(response) {
              console.log('from or to response=',response);
              return response.data;
            });
          }
          else
          {            
            return $http.post("/tada/autoComplete", { "clientPartialCommand" : newValue.replace(/\s{2,}/g, ' '), "clientCursorPosition" : 0 }).
            then(function(response) {
              return response.data;
            });
          }
      }
  };


  self.sendClientCommand = function(){
     $http.post("/tada/go", { "clientCommand" : self.clientCommand.replace(/\s{2,}/g, ' ')}).then(function(response){
                 console.log("Success!")
                 console.log(response)
                // status = parseInt(status)
                 if (response.status == "200" && response.data.message == "") {
                     console.log("Flight number is : " + response.data.flightNumber);
                     self.status = "Have A Wonderful Flight , Your Flight number is : " + response.data.flightNumber
                     self.success = true
                  }
      
      },function(rejection){
        console.log("Fail!", rejection)
        self.status = rejection.data.error;
        self.success = false
   });
  };

  self.onFocus = function() {     
    if(self.clientCommand.length === 0) {      
      self.sendAutoComplete();
    }
  };
});

   
