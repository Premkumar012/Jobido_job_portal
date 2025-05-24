var app = angular.module('jobApp', []);

app.controller('NavbarController', function ($scope, $http, $timeout) {
  $scope.postedJobs = [];
    $scope.totalApplications = 0;

    // Fetch posted jobs by current user's email
    $scope.getPostedJobs = function() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.email) {
            alert("User not logged in.");
            return;
        }

        $http.get('/api/posted-jobs', { params: { email: user.email } })
            .then(function(response) {
                $scope.postedJobs = response.data;
                // Calculate total applications
                $scope.totalApplications = $scope.postedJobs.reduce((total, job) => {
                    return total + (job.application_count || 0);
                }, 0);
            }, function(error) {
                console.error("Error fetching posted jobs:", error);
            });
    };

    $scope.getPostedJobs();// Call on page load

    // Delete job function
    $scope.deleteJob = function(jobId, index) {
        if (confirm("Are you sure you want to delete this job?")) {
            $http.delete('/delete/jobs/' + jobId)
                .then(function(response) {
                    $scope.postedJobs.splice(index, 1);
                    $scope.showSuccessNotification("Job deleted successfully!");
                })
                .catch(function(error) {
                    console.error('Error deleting job:', error);
                    $scope.showErrorNotification("Failed to delete: " + (error.data?.message || "Server error"));
                });
        }
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
      { name: 'Home', link: '/' },
      { name: 'Jobs', link: '/jobs' },
      { name: 'Post Jobs', link: '/postjobs' },
      { name: 'Login', link: '', bordered: true }
    ];

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
    
});
