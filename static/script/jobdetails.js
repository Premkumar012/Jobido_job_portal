var app = angular.module('jobApp', []);

app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                    console.log("Selected file:", element[0].files[0]);
                });
            });
        }
    };
}]);

app.controller('NavbarController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
    $scope.selectedJob = null;
    $scope.showApplyModal = false;
    $scope.user = {
        name: '',
        email: '',
        mobile: '',
        resume: null,
        coverLetter: ''
    };

    const savedUserdetails = localStorage.getItem('user');
    $scope.currentUser = savedUserdetails ? JSON.parse(savedUserdetails) : null;
    $scope.isHR = $scope.currentUser && $scope.currentUser.userType === 'hr';
    $scope.isJobSeeker = $scope.currentUser && $scope.currentUser.userType === 'jobSeeker';

    // Apply to job function
    $scope.applyToJob = function(job) {
        console.log("Applying for Job ID:", job);

        $scope.selectedJob = job.job_id;
        $scope.selectedCompany = job.company;
        $scope.selectedTitle = job.title;
        $scope.selectedLocation = job.city;

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            $scope.currentUser = JSON.parse(savedUser);
            $scope.user = {
                name: $scope.currentUser.fullname || '',
                email: $scope.currentUser.email || '',
                mobile: $scope.currentUser.mobile || '',
                resume: null,
                coverLetter: ''
            };
        }

        // Prepare JSON payload
        const checkData = {
            email: $scope.user.email,
            job_id: $scope.selectedJob
        };

        // Check if already applied
        $http.post('/api/check-application', checkData)
            .then(function(response) {
                if (response.data.applied) {
                    $scope.showErrorNotification("You have already applied for this job.");
                } else {
                    $scope.showApplyModal = true;
                }
            })
            .catch(function(error) {
                console.error("Check application error:", error);
                $scope.showErrorNotification("Failed to check application: " + (error.data?.message || "Server error"));
            });
    };

    // Close modal function
    $scope.closeApplyModal = function() {
        $scope.showApplyModal = false;
        $scope.user.resume = null;
        $scope.user.coverLetter = '';
    };

    // Form submission
    $scope.submitApplication = function() {
        if (!$scope.user.name || !$scope.user.email || !$scope.user.mobile || !$scope.user.resume) {
            alert("Please fill all required fields");
            return;
        }

        var formData = new FormData();
        formData.append('job_id', $scope.selectedJob);
        formData.append('name', $scope.user.name);
        formData.append('email', $scope.user.email);
        formData.append('mobile', $scope.user.mobile);
        formData.append('resume', $scope.user.resume);
        formData.append('company', $scope.selectedCompany);
        formData.append('job_title', $scope.selectedTitle);
        formData.append('location', $scope.selectedLocation);

        $http.post('/api/apply', formData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        }).then(function(response) {
            console.log("Application successful:", response);
            $scope.showSuccessNotification("Application submitted successfully!");
            $scope.closeApplyModal();
        }).catch(function(error) {
            console.error("Application error:", error);
            const msg = error.data?.error || "Server error";
            $scope.showErrorNotification("Failed to submit: " + msg);
        });
    };

    // Notification logic
    $scope.showNotification = false;
    $scope.notification = {
        type: 'success',
        message: ''
    };

    $scope.showSuccessNotification = function(message) {
        $scope.notification.type = 'success';
        $scope.notification.message = message;
        $scope.showNotification = true;
        $timeout($scope.hideNotification, 3000);
    };

    $scope.showErrorNotification = function(message) {
        $scope.notification.type = 'error';
        $scope.notification.message = message;
        $scope.showNotification = true;
        $timeout($scope.hideNotification, 3000);
    };

    $scope.hideNotification = function() {
        $scope.showNotification = false;
    };
}]);
