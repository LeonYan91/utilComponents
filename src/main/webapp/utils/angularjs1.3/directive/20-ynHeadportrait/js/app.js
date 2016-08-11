/**
 * Created by YN on 2015/3/10.
 */
angular.module("ynHeadportraitDemoApp",["yn.utils"]);

angular.module("ynHeadportraitDemoApp").controller("ynHeadportraitDemoCtl",function($scope){

    $scope.photoOption = {};

    $scope.showCropParams = function(){
        console.log($scope.photoOption.cropPararms);
    };
});
