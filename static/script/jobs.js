var app = angular.module('jobApp', []);

app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(false);      
    $locationProvider.hashPrefix('!');       
}]);
app.controller('JobController', ['$scope', '$http', '$location', '$timeout', 
    function($scope, $http, $location, $timeout) {
    $scope.selectedJob = null;
    $scope.initFilters = function() {
        $scope.filters = {
            keyword: $location.search().keywords || $location.search().keyword || '',
            location: $location.search().location || '',
            jobType: $location.search().jobType || '',
            workmode: $location.search().workmode || '',
            experience: $location.search().experience || '',
            postedWithin: $location.search().postedWithin || ''
        };
    };

    $scope.initFilters();

    $scope.$on('$locationChangeSuccess', function() {
        $scope.initFilters();
        if ($scope.jobs.length) {
            $scope.filteredJobs = $scope.jobs.filter($scope.jobFilter);
        }
    });

    // Fetch jobs from API
    $http.get('/api/jobs').then(function(response) {
        $scope.jobs = response.data;
        $scope.filteredJobs = $scope.jobs.filter($scope.jobFilter);
    });

    // Toggle job details view
    $scope.toggleJobDetails = function(job) {
        if ($scope.selectedJob === job) {
            $scope.selectedJob = null; // Collapse if same job is clicked
        } else {
            $scope.selectedJob = job;
        }
    };

    // Job filter function
    $scope.jobFilter = function(job) {
        // Keyword filter
        if ($scope.filters.keyword) {
            const keyword = $scope.filters.keyword.toLowerCase();
            if (!job.title.toLowerCase().includes(keyword) && 
                !job.description.toLowerCase().includes(keyword) &&
                !job.skills.toLowerCase().includes(keyword)) {
                return false;
            }
        }
        
        // Location filter
        if ($scope.filters.location && job.city.toLowerCase() !== $scope.filters.location.toLowerCase()) {
            return false;
        }
        
        // Job Type filter
        if ($scope.filters.jobType && job.type !== $scope.filters.jobType) {
            return false;
        }
        
        // Work Mode filter
        if ($scope.filters.workmode) {
            if ($scope.filters.workmode === 'Remote' && !job.is_remote) return false;
            if ($scope.filters.workmode === 'On-site' && job.is_remote) return false;
            if ($scope.filters.workmode === 'Hybrid' && !job.is_hybrid) return false;
        }
        
        // Experience filter
        if ($scope.filters.experience) {
            const filterExp = $scope.filters.experience;

            // Match filter exactly with job.experience
            if (filterExp === 'Entry Level' && job.experience !== 'Entry Level') return false;
            if (filterExp === 'Mid Level' && job.experience !== 'Mid Level') return false;
            if (filterExp === 'Senior Level' && job.experience !== 'Senior Level') return false;
            if (filterExp === 'Executive' && job.experience !== 'Executive') return false;
        }


        if ($scope.filters.postedWithin) {
            const days = parseInt($scope.filters.postedWithin);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            if (new Date(job.created_at) < cutoffDate) {
                return false;
            }
        }
        
        return true;
    };

    // Apply filters
     $scope.applyFilters = function() {
        $location.search({
            keyword: $scope.filters.keyword || null,
            location: $scope.filters.location || null,
            jobType: $scope.filters.jobType || null,
            workmode: $scope.filters.workmode || null,
            experience: $scope.filters.experience || null,
            postedWithin: $scope.filters.postedWithin || null
        });
        $scope.filteredJobs = $scope.jobs.filter($scope.jobFilter);
    };

    // Apply to job function
    $scope.applyToJob = function(job) {
        $scope.selectedJob = job;
        // Open the modal and populate the fields with user data from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            $scope.currentUser = JSON.parse(savedUser);
        }
        $scope.user = {
            name: $scope.currentUser ? $scope.currentUser.fullname : '',
            email: $scope.currentUser ? $scope.currentUser.email : '',
            mobile: $scope.currentUser ? $scope.currentUser.mobile : '',
            resume: null // Default empty for the file input
        };
        $scope.showApplyModal = true;
    };

    // Close the apply modal
    $scope.closeApplyModal = function() {
        $scope.showApplyModal = false;
    };

    // Submit Application
    $scope.submitApplication = function() {
        console.log("Applying to job: ", $scope.selectedJob);
        console.log("User Details: ", $scope.user);
        $scope.closeApplyModal();
        alert("Application submitted!");
    };

    app.directive('fileModel', ['$parse', function ($parse) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
    
          element.bind('change', function(){
            scope.$apply(function(){
              modelSetter(scope, element[0].files[0]);
            });
          });
        }
      };
    }]);

    $scope.goToApplyPage = function(jobId) {
    window.location.href = '/job/' + jobId;
    };


    

    // -----------------------------------------------------------------------------------------//

    $scope.menuOpen = false;
    $scope.showLoginModal = false;
    $scope.passwordFieldType = 'password';
    $scope.login = {};
    $scope.register = {};
    $scope.forgot = {}
    $scope.currentUser = null;
    $scope.isLoggedIn = false;
    $scope.showProfileInfo = false;
    $scope.showForgotModal = false;

    $scope.navItems = [
      { name: 'Home', link: '/', isActive: false },
      { name: 'Jobs', link: '/jobs', isActive: false },
      { name: 'Post Jobs', link: '/postjobs', isActive: false },
      { name: 'Login', link: '', bordered: true, isActive: false }
    ];

    $scope.updateActiveNav = function() {
      // Get current path (remove any hash or query params)
      var path = window.location.pathname;
      
      // Reset all active states
      $scope.navItems.forEach(function(item) {
        item.isActive = false;
      });
      
      // Find and set the active item
      var activeItem = $scope.navItems.find(function(item) {
        return item.link === path;
      });
      
      if (activeItem) {
        activeItem.isActive = true;
      }
      
      // Special case for profile if logged in
      if ($scope.currentUser && path === '/profile') {
        var profileItem = $scope.navItems.find(item => item.name.startsWith('🧑‍💻'));
        if (profileItem) profileItem.isActive = true;
      }
    };

    // Watch for route changes
    $scope.$on('$routeChangeSuccess', function() {
      $scope.updateActiveNav();
    });

    // Initial call
    $scope.updateActiveNav();

    $scope.toggleMenu = function() {
      $scope.menuOpen = !$scope.menuOpen;
    };

    document.addEventListener('click', function(event) {
      var navLinks = document.querySelector('.nav-links');
      var menuButton = document.querySelector('.menu-toggle');
      if (!navLinks.contains(event.target) && !menuButton.contains(event.target)) {
        $scope.$apply(function() {
          $scope.menuOpen = false;
        });
      }
    });

    $scope.openLoginModal = function() {
      $scope.showLoginModal = true;
      $scope.showRegisterModal = false;
      $scope.menuOpen = false;
    };

    $scope.closeLoginModal = function() {
      $scope.showLoginModal = false;
    };

    $scope.forgotPassword = function() {
      $scope.showLoginModal = false;
      $scope.showForgotModal = true;
      $scope.forgot = {};
    };

    $scope.closeForgotModal = function() {
      $scope.showForgotModal = false;
    };


    $scope.switchToRegister = function() {
      $scope.showLoginModal = false;
      $scope.showRegisterModal = true;
      $scope.login = {};
    };

    $scope.closeRegisterModal = function() {
      $scope.showRegisterModal = false;
    };

    $scope.switchToLogin = function() {
      $scope.showRegisterModal = false;
      $scope.showLoginModal = true;
      $scope.showForgotModal = false
      $scope.register = {};
    };

    // Register User
    $scope.registerUser = function() {
      if ($scope.register.password !== $scope.register.confirmpassword) {
        alert("Passwords do not match!");
        return;
      }

      var registrationData = {
        name: $scope.register.name,
        email: $scope.register.email,
        password: $scope.register.password,
        userType: $scope.register.userType
      };

      $http.post('/api/register', registrationData)
        .then(function(response) {
          $scope.showSuccessNotification("Registered successfully!");
          $scope.showRegisterModal = false;
          $scope.showLoginModal = true;
          $scope.register = {};
        })
        .catch(function(error) {
            $scope.showErrorNotification("Register failed: " + (error.data?.message || "Server error"));
        });
    };

    // Login User
    $scope.loginUser = function() {
    if (!$scope.login.userType) {
        $scope.showErrorNotification("Please select your user type (Job Seeker or HR)");
        return;
    }

    $http.post('/api/login', {
        username: $scope.login.username,
        password: $scope.login.password,
        userType: $scope.login.userType
    })
    .then(function(response) {
        $scope.showSuccessNotification("Logged in successfully!");
        
        if (response.data.user) {
            $scope.currentUser = response.data.user;
            localStorage.setItem('user', JSON.stringify($scope.currentUser));

            let navText = '🧑‍💻 ' + $scope.currentUser.fullname;
            $scope.navItems[4] = {
                name: navText,
                link: '#profile',
                bordered: true
            };

            const jobLinkItem = $scope.currentUser.userType === 'jobSeeker'
                ? { name: 'Applied Jobs', link: 'applyjobs' }
                : { name: 'Posted Jobs', link: 'postedjobs' };

            $scope.navItems[3] = jobLinkItem;
            $scope.isLoggedIn = true;
        }

        $scope.showLoginModal = false;
        $scope.login = {};
        })
        .catch(function(error) {
            $scope.showErrorNotification("Login failed: " + (error.data?.message || "Server error"));
        });
        $scope.updateActiveNav();
    };

    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      $scope.currentUser = JSON.parse(savedUser);
      $scope.navItems[4] = {
        name: '🧑‍💻 ' + $scope.currentUser.fullname,
        link: '#profile',
        bordered: true
      };

      const jobLinkItem = $scope.currentUser.userType === 'jobSeeker'
        ? { name: 'Applied Jobs', link: 'applyjobs' }
        : { name: 'Posted Jobs', link: 'postedjobs' };

      $scope.navItems[3] = jobLinkItem;
      $scope.isLoggedIn = true;
    }

    // Logout
    $scope.logout = function() {
      localStorage.removeItem('user');
      $scope.currentUser = null;
      $scope.navItems = [
        { name: 'Home', link: '/' },
        { name: 'Jobs', link: '/jobs' },
        { name: 'Post Jobs', link: '/postjobs' },
        { name: 'Login', link: '', bordered: true }
      ];
      $scope.isLoggedIn = false;
      $scope.showProfileInfo = false;
      $scope.showSuccessNotification("Logged out successfully!");
      $scope.updateActiveNav();
    };

    $scope.toggleProfileInfo = function() {
      $scope.showProfileInfo = !$scope.showProfileInfo;
      $scope.menuOpen = false;
    };

    // Add these to your controller
    $scope.showNotification = false;
    $scope.notification = {
        type: 'success',
        message: ''
    };

    $scope.showSuccessNotification = function(message) {
        $scope.notification.type = 'success';
        $scope.notification.message = message;
        $scope.showNotification = true;
        
        // Auto-hide after 5 seconds
        $timeout(function() {
            $scope.hideNotification();
        }, 3000);
    };

    $scope.showErrorNotification = function(message) {
        $scope.notification.type = 'error';
        $scope.notification.message = message;
        $scope.showNotification = true;
        
        // Auto-hide after 5 seconds
        $timeout(function() {
            $scope.hideNotification();
        }, 3000);
    };

    $scope.hideNotification = function() {
        $scope.showNotification = false;
    };
    
    // Add these to your NavbarController
$scope.forgot = {
    email: '',
    password: '',
    confirmpassword: '',
    emailVerified: false,
    verificationInProgress: false
};

$scope.verifyEmail = function() {
    if (!$scope.forgot.email) {
        $scope.showErrorNotification("Please enter your email");
        return;
    }

    $scope.forgot.verificationInProgress = true;
    
    $http.post('/api/verify-email', {  email: $scope.forgot.email,
    userType: $scope.register.userType   })
        .then(function(response) {
            if (response.data.exists) {
                $scope.forgot.emailVerified = true;
                $scope.showSuccessNotification("Email verified! You can now reset your password");
            } else {
                $scope.showErrorNotification("Email not found in our system");
            }
        })
        .catch(function(error) {
            $scope.showErrorNotification("Error verifying email: " + (error.data?.message || "Server error"));
        })
        .finally(function() {
            $scope.forgot.verificationInProgress = false;
        });
};

$scope.resetPassword = function() {
    if (!$scope.forgot.emailVerified) {
        $scope.showErrorNotification("Please verify your email first");
        return;
    }

    if ($scope.forgot.password !== $scope.forgot.confirmpassword) {
        $scope.showErrorNotification("Passwords do not match!");
        return;
    }

    $http.post('/api/reset-password', {
    email: $scope.forgot.email,
    password: $scope.forgot.password,
    userType: $scope.register.userType
})

    .then(function(response) {
        $scope.showSuccessNotification("Password reset successfully!");
        $scope.showForgotModal = false;
        $scope.showRegisterModal = false;
        $scope.showLoginModal = true;
        $scope.forgot = {
            email: '',
            password: '',
            confirmpassword: '',
            emailVerified: false
        };
    })
    .catch(function(error) {
        $scope.showErrorNotification("Password reset failed: " + (error.data?.message || "Server error"));
    });
};
    
}]);


