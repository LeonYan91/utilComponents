angular.module("yn.utils").directive("ynDate",function(){
    return {
        restrict:"AE",
        require: '?ngModel',
        scope:null,
        link:function($scope,$element,$attrs,ngModelController){
            $scope.dateFormat = $attrs.dateFormat;
            $scope.datePlugin = $attrs.datePlugin;
            $scope.dateFork = $attrs.dateFork;
            //在input框外包裹一个div
            if($scope.dateFork == undefined) {
                $element.wrap('<div class="input-icon right"></div>');
                //添加“×”按钮与方法
                $element.before('<i class="fa fa-times"></i>');
                $element.prev("i").bind('click', function () {
                    //清除页面的value值
                    $(this).next().val(null);
                    //清除ngModel的值
                    ngModelController.$setViewValue(null);
                    //ngModelController.$modelValue = null;
                    //ngModelController.$viewValue = null;
                });
            }
        	
            if($scope.datePlugin){
                var datePlugin = $scope.datePlugin;

                var dateFormat = $scope.dateFormat;

                if((datePlugin == "date")){

                    var settings_date = {
                        language: 'zh-CN',
                        minView: 3,
                        format: 'yyyy-mm-dd',
                        todayHighlight: true,
                        todayBtn: true,
                        autoclose: true
                    };

                    var settings_year = {
                        language: 'zh-CN',
                        startView: 4,
                        minView: 4,
                        format: 'yyyy',
                        todayHighlight: true,
                        autoclose: true
                    };

                    var settings_complateDate = {
                        language: 'zh-CN',
                        startView: 2,
                        maxView: 2,
                        minView: 0,
                        format: 'yyyy-mm-dd hh:ii',
                        todayHighlight: true,
                        todayBtn: true,
                        autoclose: true
                    };

                    var settings_yearAndMonth = {
                        language: 'zh-CN',
                        startView: 3,
                        maxView: 2,
                        minView: 3,
                        format: 'yyyy-mm',
                        todayHighlight: true,
                        todayBtn: true,
                        autoclose: true
                    };

                    if(dateFormat == "yyyy"){
                        $element.datetimepicker(settings_year);
                    }else if(dateFormat == "yyyy-mm-dd hh:ii"){
                        settings_complateDate.format = $scope.dateFormat;
                        $element.datetimepicker(settings_complateDate);
                    }else if(dateFormat == 'yyyy-mm'){
                        settings_date.format = $scope.dateFormat;
                        $element.datetimepicker(settings_yearAndMonth);
                    }else{
                        settings_date.format = $scope.dateFormat;
                        $element.datetimepicker(settings_date);
                    }
                }

                if(datePlugin == "time"){
                    var settings_time = {
                        autoclose: true,
                        minuteStep: 5,
                        showSeconds: false,
                        showMeridian: false
                    };
                    $element.timepicker(settings_time);
                }


                if(datePlugin == "date_bg"){

                    var settings_dateBtnGroup = {
                     language: 'zh-CN',
                     minView: 3,
                     format: 'yyyy-mm-dd',
                     todayHighlight: true,
                     todayBtn: true,
                     autoclose: true
                     };

                    if(dateFormat){
                        settings_dateBtnGroup.format = dateFormat;
                    }

                     $element.datetimepicker(settings_dateBtnGroup);

                    var calendarSpan = "<span class='input-group-btn'>" +
                        "<button class='btn default' type='button'><i class='fa fa-calendar'></i></button>"+
                        "</span>";
                    $element.parent().append(calendarSpan);

                    $element.next("span").on("click",function(e){
                        e.preventDefault();
                        $element.datetimepicker("show");

                    })
                }

            }

        }
    }
});