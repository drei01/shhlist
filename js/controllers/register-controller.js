app.controller('RegisterController', function ($scope,
                                                $ionicPopup,
                                                $state,
                                                AuthService) {
    $scope.data = {};
    
    $scope.register = function(){
        if(!$scope.data.email || !$scope.data.password || $scope.data.email==='' || $scope.data.password===''){//check for valid input
            return;
        }
        
        var data = {
            email: $scope.data.email,
            password: $scope.data.password,
            name: $scope.data.name                    
        };
        
        AuthService.register(data)
        .then(function(auth){
            if(auth){
                $scope.$emit('app:login');
                $state.go('app.tasks');
            }
        }).catch(function(error){
            $ionicPopup.alert({
                title: 'Oops',
                template: error ? error.message : 'Something went wrong registering your account. Try again'
            });
        });
    };
    
    //When this controller loads, check that the user isn't already registered
    AuthService.checkAuth().then(function(auth){
        if(auth){
            $scope.$emit('app:login');
            $state.go('app.tasks');
        }
    }).catch(function(error){
        $scope.showAlert(error);
    });
});