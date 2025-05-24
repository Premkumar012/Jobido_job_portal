angular.module('jobApp', [])
.controller('NavbarController', ['$scope', '$http', '$timeout', 
    function($scope, $http,  $timeout) {

       $scope.today = new Date().toISOString().split('T')[0];

       $scope.$watch('job.deadline', function(newVal) {
            if (newVal) {
                const selectedDate = new Date(newVal);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    $scope.jobForm.deadline.$setValidity('minDate', false);
                } else {
                    $scope.jobForm.deadline.$setValidity('minDate', true);
                }
            }
        });

        $scope.salaryError = false;

        $scope.validateSalary = function() {
            if ($scope.job.minSalary != null && $scope.job.maxSalary != null) {
                $scope.salaryError = parseFloat($scope.job.maxSalary) <= parseFloat($scope.job.minSalary);
            } else {
                $scope.salaryError = false; // Don't show error if fields are incomplete
            }
        };

      
       const savedUserdetails = localStorage.getItem('user');
      $scope.currentUser = savedUserdetails ? JSON.parse(savedUserdetails) : null;
      let contactEmailFromStorage = $scope.currentUser ? $scope.currentUser.email : '';
      $scope.isHR = $scope.currentUser && $scope.currentUser.userType === 'hr';
        $scope.isJobSeeker = $scope.currentUser && $scope.currentUser.userType === 'jobSeeker';

    // Initialize job object
    $scope.job = {
        title: '',
        department: '',
        type: '',
        experience: '',
        country: '',
        city: '',
        isRemote: false,
        description: '',
        requirements: '',
        skills: '',
        minSalary: null,
        maxSalary: null,
        showSalary: false,
        contact_email: contactEmailFromStorage,
        deadline: '',
        company: '',  
        logo: null  ,
        education: '',
    };

    // Temporary skill input
    $scope.tempSkill = '';

    // Add skill to array
    $scope.addSkill = function() {
        if ($scope.tempSkill.trim() && $scope.job.skills.indexOf($scope.tempSkill) === -1) {
            $scope.job.skills.push($scope.tempSkill.trim());
            $scope.tempSkill = '';
        }
    };

    // Remove skill from array
    $scope.removeSkill = function(index) {
        $scope.job.skills.splice(index, 1);
    };

    // Form submission
    $scope.submitJob = function() {
    if ($scope.jobForm.$invalid) {
        alert('Please fill all required fields correctly');
        return;
    }

    var formattedDeadline = '';
    if ($scope.job.deadline) {
        var deadlineDate = new Date($scope.job.deadline);
        formattedDeadline = deadlineDate.toISOString().split('T')[0];
    }

    // Prepare FormData for submission (to handle file upload)
    var formData = new FormData();
    
    // Append all job data
    formData.append('title', $scope.job.title);
    formData.append('department', $scope.job.department);
    formData.append('company', $scope.job.company);
    formData.append('type', $scope.job.type);
    formData.append('experience', $scope.job.experience);
    formData.append('country', $scope.job.country);
    formData.append('city', $scope.job.city);
    formData.append('isRemote', $scope.job.isRemote);
    formData.append('description', $scope.job.description);
    formData.append('requirements', $scope.job.requirements);
    formData.append('skills', $scope.job.skills);
    formData.append('minSalary', $scope.job.minSalary);
    formData.append('maxSalary', $scope.job.maxSalary);
    formData.append('showSalary', $scope.job.showSalary);
    formData.append('contactEmail', contactEmailFromStorage);
    formData.append('deadline', formattedDeadline);  // Use the formatted date
    formData.append('education', $scope.job.education);
    
    // Append file if exists
    if ($scope.job.logo) {
        formData.append('logo', $scope.job.logo);
    }

    $http.post('/api/jobs', formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
    })
    .then(function(response) {
        $scope.showSuccessNotification("Job Posted successfully!");
        // Reset form
        $scope.job = {
            title: '',
            department: '',
            type: '',
            experience: '',
            country: '',
            city: '',
            isRemote: false,
            description: '',
            requirements: '',
            skills: '',
            minSalary: null,
            maxSalary: null,
            showSalary: false,
            contactEmail: '',
            deadline: '',
            company: '',
            logo: null,
            education: ''
        };
        $scope.jobForm.$setPristine();
    })
    .catch(function(error) {
        console.error('Error posting job:', error);
        $scope.showErrorNotification("Posting failed: " + (error.data?.message || "Server error"));
    });
};

    
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