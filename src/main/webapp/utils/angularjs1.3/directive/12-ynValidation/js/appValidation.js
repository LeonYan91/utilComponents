var ngValidationApp = angular.module('ngValidationApp',['yn.utils']);

ngValidationApp.controller('ngValidationCtrl',['$scope',function($scope){

    $scope.user={
        name:'11111',
        age:22,
        password:'1111',
        email:'wx@qq.com',
        url:'http://www.baidu.com',
        intro:'qwertyuiop'
    },

    $scope.submitupForm = function(){
        if($scope.submitup_form.$valid){

        }else{
            debugger;

        }
    },

    $scope.resetForm = function(){
        $scope.user={
            name:'',
            age:'',
            password:'',
            email:'',
            url:'',
            intro:''
        }
    }

}]);
