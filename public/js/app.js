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
