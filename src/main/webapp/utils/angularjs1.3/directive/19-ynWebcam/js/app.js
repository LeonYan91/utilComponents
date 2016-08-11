/**
 * Created by YN on 2015/3/10.
 */
angular.module("ynWebcamDemoApp",["yn.utils","ui.bootstrap"]);

angular.module("ynWebcamDemoApp").controller("ynWebcamDemoCtl",function($scope){
    $scope.camOption = {
        width:320,
        height:240
    };

});
