/**
 * Created by YN on 2015/3/10.
 */
angular.module("validationDemoApp",["yn.utils"]);

angular.module("validationDemoApp").controller("validationDemoCtl",function($scope){
    //自定义逻辑验证配置
    $scope.custom = {
        content:'名字不是tom',
        fun:function(){
            if($scope.customModel != 'tom'){
                return false;
            }else{
                return true;
            }
        }
    };

    //提交按钮时
    $scope.confirm = function(){
        if($scope.demoForm.$invalid || !$scope.custom.fun()){
            alert("验证失败");
        }else{
            alert("成功了");
        }
    };
});
