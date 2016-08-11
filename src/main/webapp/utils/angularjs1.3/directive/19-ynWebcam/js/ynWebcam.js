/**
 * Created by YN on 2015/4/2.
 */

angular.module("yn.utils").directive("ynWebcam",function(){
    return {
        restrict:"AE",
        scope:{ynWebcam:"="},
        templateUrl:function(tElement, tAttrs) {
            return basePath + "/static/yineng/components/19-ynWebcam/template/template.html";
        },
        controller:["$scope","ynNotification",function($scope,ynNotification){

            //判断是否是IE浏览器
            function isIE() { //ie?
                if (!!window.ActiveXObject || "ActiveXObject" in window)
                    return true;
                else
                    return false;
            }

            //当不传入参数时的默认参数
            $scope.option = {
                startCamId:'#startCamId',
                width: 320,
                height: 240,
                image_format: 'jpeg',
                jpeg_quality: 90,
                shotFun:function(){}
            };

            //和传入的参数进行合并
            angular.extend($scope.option,$scope.ynWebcam);

            //在crop剪裁
            $scope.option.crop_width = $scope.option.crop_width ? $scope.option.crop_width :  $scope.option.width;
            $scope.option.crop_height = $scope.option.crop_height ? $scope.option.crop_height :  $scope.option.height;

            //设置参数
            Webcam.set($scope.option);

            //设置错误操作
            Webcam.on('error',function(){
//                ynNotification.alert('error','启动摄像头失败!','请允许使用摄像头！');
                $scope.isLoading = false;
                $scope.loadError = true;
                $scope.$apply();
            });
            //正在运行
            Webcam.on('live',function(){
//                console.log("live");
                $scope.isLoading = false;
                $scope.loadError = false;
                $scope.$apply();
            });
            $scope.showCam = false;

            //在给定开始摄像的id按钮上绑定启动摄像头方法
            var initCamera = function(){
                angular.element($scope.option.startCamId).on("click",function(){
                    //显示摄像组件
                    $scope.showCam = true;
                    //正在加载
                    $scope.isLoading = true;
                    //如果是IE浏览器，无法再所要绑定摄像头的元素上面设置隐藏，所以开始就需要显示，将isLoading这个步骤去掉
                    if(isIE()){
                        $scope.isLoading = false;
                    }
                    //加载失败
                    $scope.loadError = false;
                    //和组件上的摄像头显示区域绑定
                    Webcam.attach("#ynWebcamId");
                    $scope.$apply();
                });
            };

            //出现了bug，第二次时进入时找不到此按钮，需要设置个延迟
            window.setTimeout(initCamera,500);


            //在传入的ynWebcam参数上绑定一个拍照成功后的dataUri
            $scope.ynWebcam.dataUri = '';

            //拍照成功，关闭摄像头，返回摄像头图片url
            $scope.takeSnapshot = function(data){
                Webcam.snap( function(data) {
                    $scope.ynWebcam.dataUri = data;
                    //在IE10下面会出现拍的照没有及时显示，需要apply下
                    if(isIE()){
                        $scope.$apply();
                    }
                } );
                //拍照完成后关闭摄像功能，包括不显示下面的按键条
                $scope.showCam = false;
                //调用提供的回调函数，可能是显示隐藏的图片
                $scope.option.shotFun();
                Webcam.reset();
            };

            //刷新摄像头
            $scope.refreshWebcam = function(){
                Webcam.attach('#ynWebcamId');
            };

            //点击返回，取消摄像头拍照功能
            $scope.cancelWebcam = function(){
                //关闭摄像功能，包括不显示下面的按键条
                $scope.showCam = false;
                //调用提供的回调函数，可能是显示隐藏的图片
                $scope.option.shotFun();
                Webcam.reset();
            };
        }],
        link:function(scope, element, attrs, ctrls, transcludeFn){

        }
    };
});
