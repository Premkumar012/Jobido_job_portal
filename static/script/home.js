var app = angular.module('jobApp', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/jobs', {
      templateUrl: 'jobs.html',
      controller: 'JobsController'
    })
    .when('/postjobs', {
      templateUrl: 'postjobs.html'
    });
    
  // Configure hash prefix and HTML5 mode
  $locationProvider.hashPrefix('!');
  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false
  });
}]);

// Define the controller
app.controller('NavbarController', ['$scope', '$http', '$location', function($scope, $http, $location) {
  // Navigation functions
  $scope.navigateToJobs = function() {
    $location.path('/jobs');
  };

  $scope.navigateToPostJobs = function() {
    $location.path('/postjobs');
  };

  // Additional controller logic can go here...
}]);

document.getElementById('jobSearchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const params = new URLSearchParams(formData).toString();
    window.location.href = '/jobs#!/?' + params;
});
