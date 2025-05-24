angular.module('jobApp', [])

.controller('AdminController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {    // Initialize variables
    $scope.activeTab = 'usercreds';
    $scope.showUserForm = false;
    $scope.showJobForm = false;
    $scope.users = [];
    $scope.jobs = [];
    $scope.applicants = [];
    $scope.newUser = {};
    $scope.newJob = {};

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

    $http.post('/admin/jobs', formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
    })
    .then(function(response) {
        $scope.showSuccessNotification("Job Posted successfully!");
        // alert("posted") 
        $scope.loadJobs();
        $scope.showJobForm = false;
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

    // Set active tab
    $scope.setActiveTab = function(tab) {
        $scope.activeTab = tab;
    };

    // Toggle forms
    $scope.toggleUserForm = function() {
        $scope.showUserForm = !$scope.showUserForm;
    };

    $scope.toggleJobForm = function() {
        $scope.showJobForm = !$scope.showJobForm;
    };

    // Load users
    $scope.loadUsers = function() {
        $http.get('/api/users')
        .then(function(response) {
            $scope.users = response.data;
        }, function(error) {
            console.error('Error loading users:', error);
            $scope.showErrorNotification("Failed to Load user. Please try again" );
        });
    };

    // Load jobs
    $scope.loadJobs = function() {
        $http.get('/api/jobs')
        .then(function(response) {
            $scope.jobs = response.data;
        }, function(error) {
            console.error('Error loading jobs:', error);
            $scope.showErrorNotification("Failed to load jobs. Please try again ");

        });
    };

    // Load applicants
    $scope.loadApplicants = function() {
        $http.get('/admin/applicants')
        .then(function(response) {
            $scope.applicants = response.data;
        }, function(error) {
            console.error('Error loading applicants:', error);
            $scope.showErrorNotification("Failed to load applicants. Please try again ");
        });
    };

    // Create user
    $scope.createUser = function() {
        $http.post('/api/users', $scope.newUser)
        .then(function(response) {
            $scope.showSuccessNotification("User created successfully!");
            $scope.newUser = {};
            $scope.showUserForm = false;
            $scope.loadUsers();
        }, function(error) {
            console.error('Error creating user:', error);
            $scope.showErrorNotification("Failed to create user. Please try again");

        });
    };

    

    $scope.deleteJob = function(jobId, index) {
        if (confirm("Are you sure you want to delete this job?")) {
            $http.delete('/delete/jobs/' + jobId)
                .then(function(response) {
                    $scope.jobs.splice(index, 1);
                    $scope.showSuccessNotification("Job deleted successfully!");
                    // alert("Deleted Successfully")
                    
                    $scope.loadJobs();
                })
                .catch(function(error) {
                    console.error('Error deleting job:', error);
                    $scope.showErrorNotification("Failed to delete: " + (error.data?.message || "Server error"));
                });
        }
        
    };

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


    // Initial load
    $scope.loadUsers();
    $scope.loadJobs();
    $scope.loadApplicants();
}]);