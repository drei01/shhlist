app.controller('LoginController', function($scope, $ionicPopup, $state, AuthService) {
    $scope.data = {};
    $scope.resetPasswordData = {};

    $scope.showResetPassword = false;

    $scope.login = function() {
        AuthService.login($scope.data.email, $scope.data.password)
            .then(function(auth) {
                if (auth) {
                    $scope.$emit('app:login'); //tell the content controller to perform
                    $state.go('app.tasks');
                } else {
                    $ionicPopup.alert({
                        title: 'Oops',
                        template: 'Something went wrong signing you in',
                    });
                }
            })
            .catch(function(error) {
                $ionicPopup.alert({
                    title: 'Oops',
                    template: error,
                });
            });
    };

    $scope.resetPassword = function() {
        AuthService.resetPassword($scope.resetPasswordData.email)
            .then(function() {
                $ionicPopup.alert({
                    title: 'Password Reset',
                    template:
                        'If we found your account then you will recieve an email shortly with instructions to reset your password',
                });
            })
            .catch(function() {
                $ionicPopup.alert({
                    title: 'Oops',
                    template: 'Something went wrong resetting your password. Please try again.',
                });
            });
    };

    //When this controller loads, check that the user isn't already registered
    AuthService.checkAuth()
        .then(function(auth) {
            if (auth) {
                $scope.$emit('app:login'); //tell the content controller to perform
                $state.go('app.tasks');
            }
        })
        .catch(function(error) {
            $scope.showAlert(error);
        });
});
