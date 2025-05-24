var app = angular.module('jobApp', []);

app.controller('NavbarController', ['$scope', '$http', '$window', 
function($scope, $http, $window) {
    // Initialize user state
    $scope.currentUser = null;
    $scope.isLoggedIn = false;
    $scope.showProfileInfo = false;

    // Navigation items
    $scope.navItems = [
        { name: 'Home', link: '/' },
        { name: 'Jobs', link: '/jobs' },
        { name: 'Post Jobs', link: '/postjobs' },
        { name: 'Login', link: '', bordered: true, action: $scope.openLoginModal }
    ];

    // Check for existing session on load
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        $scope.setCurrentUser(JSON.parse(savedUser));
    }

    // Unified user setter
    $scope.setCurrentUser = function(user) {
        $scope.currentUser = user;
        $scope.isLoggedIn = true;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update navigation
        $scope.navItems[3] = {
            name: (user.userType === 'hr' ? '👔 ' : '🧑‍💻 ') + user.fullname,
            link: '/profile',
            bordered: true,
            action: function() { $window.location.href = '/profile'; }
        };
    };

    // Login function
    $scope.loginUser = function() {
        $http.post('/api/login', $scope.login)
            .then(function(response) {
                if (response.data.user) {
                    $scope.setCurrentUser(response.data.user);
                    $scope.showLoginModal = false;
                    $scope.login = {};
                    alert("Login successful!");
                }
            })
            .catch(function(error) {
                alert("Login failed: " + (error.data?.message || "Server error"));
            });
    };

    // Logout function
    $scope.logout = function() {
        localStorage.removeItem('user');
        $scope.currentUser = null;
        $scope.isLoggedIn = false;
        $scope.navItems[3] = { 
            name: 'Login', 
            link: '', 
            bordered: true,
            action: $scope.openLoginModal
        };
        $window.location.href = '/';
    };

    // Other functions remain the same...
}]);

// Job Controller
app.controller('JobController', ['$scope', '$http', '$location',
function($scope, $http, $location) {
    // Your existing job-related code
    
    // Share user state from NavbarController
    $scope.$on('userUpdated', function(event, user) {
        $scope.currentUser = user;
        $scope.isLoggedIn = !!user;
    });
}]);