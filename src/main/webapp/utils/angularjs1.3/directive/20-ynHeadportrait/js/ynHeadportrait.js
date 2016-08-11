/**
 * Created by YN on 2015/4/3.
 */

angular.module("yn.utils").directive("ynHeadportrait",function(){
    return {
        restrict:"AE",
        scope:{ynHeadportrait:"="},
        templateUrl:function(tElement, tAttrs) {
            return basePath + "/static/yineng/components/20-ynHeadportrait/template/headPortrait.html";
        },
        controller:["$scope",function($scope){
            //初始化图片参数
            $scope.photoForm = $scope.ynHeadportrait.photoForm ? $scope.ynHeadportrait.photoForm : 'jpg,png,gif,bmp';
            $scope.photoString = $scope.photoForm.replace(',','.');

            //初始化最小以及最大允许上传的图片分辨率
            if(!$scope.ynHeadportrait.sizeBound){
                //默认必须上传大于100x100的图片
                $scope.ynHeadportrait.sizeBound = {
                    minSize:{w:100,h:100}
                };
            }

            var minSize = $scope.ynHeadportrait.sizeBound.minSize;

            $scope.uploaderAttrs={
                method:"POST",
                auto:false,
                threads:4,
                getSrc:function(src,file){
                    //判断图片大小
                    if(!file){
                        console.log("获取图片失败！");
                        return;
                    }
                    var height = file._info.height;
                    var width = file._info.width;
                    if(height<minSize.h || width<minSize.w){
                        $scope.minSizeError = true;
                        $scope.$apply();
                        return;
                    }

                    $scope.ynHeadportrait.dataUri = '';
                    $scope.ynHeadportrait.dataUri = src;


//                    $scope.cropApi.destroy();
//                    window.setTimeout(function(){
//                        $scope.initJcrop()
//                    },100);
                    $scope.$apply();

                },
                pick: {
                    id:"#picker",
                    innerHTML: "选择图片",
                    multiple:false
                },
                accept: {
                    title: 'Images',
                    extensions: $scope.photoForm,
                    mimeTypes: 'image/*'
                },
                uploadBtn: false,
                showView: false
            };

            //图片截取预览效果参数
            var boundx ,boundy;
            /**获取图片截取预览效果的展示对象**/
            var $pcntSmall = $('.pixel-top');
            var  $pimgSmall = $('.pixel-top img');
            var $pcntBig = $('.pixel-bottom');
            var  $pimgBig = $('.pixel-bottom img');
            /*********************************/
            //初始化jcrop
            $scope.initJcrop = function(){
                $('#resultImgId').Jcrop(
                    {
                        setSelect:[80,20,200,200],
                        aspectRatio: 1/1,
                        onSelect:$scope.updateView,
                        onChange:$scope.updateView
                    },function(){
                        $scope.cropApi = this;

                        /**图片截取预览效果参数**/
                        var bounds = this.getBounds();
                        boundx = bounds[0];
                        boundy = bounds[1];

//                        $('.pixel-top img').css({
//                            width: Math.round((48/50) * 320) + 'px',
//                            height: Math.round((48/50) * 240) + 'px',
//                            marginLeft: '-' + Math.round((48/50) * 50) + 'px',
//                            marginTop: '-' + Math.round((48/50) * 50) + 'px'
//                        });
//                        $('.pixel-bottom img').css({
//                            width: Math.round((98/50) * 320) + 'px',
//                            height: Math.round((98/50) * 240) + 'px',
//                            marginLeft: '-' + Math.round((98/50) * 50) + 'px',
//                            marginTop: '-' + Math.round((98/50) * 50) + 'px'
//                        });
                        //选择图片后默认预览
                        var c = {
                            w:180,
                            h:180,
                            x:80,
                            y:20
                        }
                        $scope.updatePreview(c,$pcntSmall.width(),$pcntSmall.height(),$pimgSmall);
                        $scope.updatePreview(c,$pcntBig.width(),$pcntBig.height(),$pimgBig);
                        /**********************/
                    });
            };

            //第一此进去，先初始化一下jcrop裁剪组件，主要是才能destroy
//            window.setTimeout(function(){
//                    $scope.initJcrop()
//                },100);

            //摄像头组件参数选项
            $scope.camOption = {
                width: 320,
                height: 240,
                shotFun:function(){
                    $scope.duringCam = false;
//                    window.setTimeout(function(){
//                        $scope.initJcrop()
//                    },100);
                }
            };
            //当裁剪选择，或者移动时，获取当前的位置，并赋值为参数对象
            $scope.updateView = function(c){
                $scope.ynHeadportrait.cropPararms = c;
                /**当裁剪选择，或者移动时改变图片截取预览**/
                $scope.updatePreview(c,$pcntSmall.width(),$pcntSmall.height(),$pimgSmall);
                $scope.updatePreview(c,$pcntBig.width(),$pcntBig.height(),$pimgBig);
                /*******************************************/
            };

            //观察webcam摄像组件返回的图片uri,及时将其显示在头像组件额图片预览上
            $scope.$watch(
                function(){
                    return $scope.camOption.dataUri;
                },
                function(){
                    $scope.ynHeadportrait.dataUri = $scope.camOption.dataUri;
                }
            );

            //观察图片是否改变，初始化jcrop
            $scope.$watch(
                function(){
                    return $scope.ynHeadportrait.dataUri;
                },
                function(){
                    if($scope.ynHeadportrait.dataUri){
                        //初始化图片大小错误提示
                        $scope.minSizeError = false;
                        if($scope.cropApi){
                            $scope.cropApi.destroy();
                        }else{
                            $scope.ynHeadportrait.cropPararms = {};
                        }
                        window.setTimeout(function(){
                            $scope.initJcrop()
                        },100);
                    }
                }
            );

            //TODO 以后会在config上加一个 initPicture 参数，现在暂时停顿2秒后,使用 $scope.ynHeadportrait.dataUri 作为还原的初始图片
            window.setTimeout(function(){
                if(!$scope.ynHeadportrait.initPicture){
                    $scope.ynHeadportrait.initPicture = $scope.ynHeadportrait.dataUri;
                }
            },1000);

            //还原图片到initPicture
            $scope.restorePicture = function(){
                $scope.ynHeadportrait.dataUri = $scope.ynHeadportrait.initPicture;
            };

            //默认不处于拍照状态
            $scope.duringCam = false;
            //启动摄像头，不显示按钮和图片
            $scope.startCam = function(){
                //启动摄像头，销毁jcrop绑定，以便初始化jcrop
//                $scope.cropApi.destroy();
                $scope.duringCam = true;
            };



            //以下代码是在做裁剪预览功能时使用的，因为时间及难度问题，先不开发20150408 12:30
            //////////////////图片裁剪预览开始//////////////////////////
//            $scope.generateCrop = function(){
//
//
//
//            // Create variables (in this scope) to hold the API and image size
//
//            // Grab some information about the preview pane
//                $scope.preview = $('#preview-pane'),
//                $scope.pcnt = $('#preview-pane .preview-container'),
//                $scope.pimg = $('#preview-pane .preview-container img'),
//
//                $scope.xsize = $scope.pcnt.width(),
//                $scope.ysize = $scope.pimg.height();
//
//                $('#resultImgId').Jcrop({
//                    setSelect:[50,50,$scope.xsize,$scope.ysize],
//                    onChange: $scope.updatePreview,
//                    onSelect: $scope.updatePreview,
//                    aspectRatio: $scope.xsize / $scope.ysize
//                },function(){
//                    // Use the API to get the real image size
//                    var bounds = this.getBounds();
//                    $scope.boundx = bounds[0];
//                    $scope.boundy = bounds[1];
//                    // Store the API in the jcrop_api variable
//                    $scope.cropApi = this;
//
//                    // Move the preview into the jcrop container for css positioning
//                    $scope.preview.appendTo($scope.cropApi.ui.holder);
//
//                    console.log($scope.pimg);
//                    $scope.pimg.attr("src",$scope.camOption.dataUri);
//                });
//
//                $scope.updatePreview = function(c)
//                {
//                    if (parseInt(c.w) > 0)
//                    {
//                        var rx = $scope.xsize / c.w;
//                        var ry = $scope.ysize / c.h;
//
//                        $scope.pimg.css({
//                            width: Math.round(rx * $scope.boundx) + 'px',
//                            height: Math.round(ry * $scope.boundy) + 'px',
//                            marginLeft: '-' + Math.round(rx * c.x) + 'px',
//                            marginTop: '-' + Math.round(ry * c.y) + 'px'
//                        });
//                    }
//                };
//
//            };
//            //////////////////图片裁剪预览结束//////////////////////////
//            $scope.generateCrop();
            ////////////////////图片裁剪预览开始（熊虹淞）//////////////////////////
            $scope.updatePreview = function(c,xsize,ysize,$pimg)
            {
                if (parseInt(c.w) > 0)
                {
                    var rx = xsize / c.w;
                    var ry = ysize / c.h;

                    $pimg.css({
                        width: Math.round(rx * boundx) + 'px',
                        height: Math.round(ry * boundy) + 'px',
                        marginLeft: '-' + Math.round(rx * c.x) + 'px',
                        marginTop: '-' + Math.round(ry * c.y) + 'px'
                    });

                }
            };
            //////////////////图片裁剪预览结束//////////////////////////

        }],
        link:function(scope, element, attrs, ctrls, transcludeFn){

        }
    };
});
