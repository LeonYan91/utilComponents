/**
 * created by yanliang on 20160307
 * 计酬年月下拉选择器，主要是在 经营核算报表 处使用到了，所有封装成指令
 */
angular.module("yn.utils").directive("payDateSelect",['$http',function($http){
    return {
        replace:true,
        scope:{
            model:"="
        },
        templateUrl : basePath + '/scripts/components/32-payDateSelect/payDateSelect.html',
        restrict: 'AE',//只能作为属性使用
        link: function ($scope, $element, $attrs, ctrl) {
            if(!$scope.model){
                throw new Error('DOM上没有model属性，无法初始化指令！');
            }

            var startDate = $attrs.startDate ? $attrs.startDate : 'startDate';
            var endDate = $attrs.endDate ? $attrs.endDate : 'endDate';
            var totalStartDate = $attrs.totalStartDate ? $attrs.totalStartDate : 'totalStartDate';
            var totalEndDate = $attrs.totalEndDate ? $attrs.totalEndDate : 'totalEndDate';
            var monthListKey = $attrs.monthListKey ? $attrs.monthListKey : 'cycleYearMonthDTOList';
            //是否显示快速选中按钮
            $scope.disableQuick = $attrs.disableQuick != undefined;
            //是否允许 ‘请选择下拉选项’
            var enableEmpty = $attrs.enableEmpty == 'enableEmpty';

            //默认第一次选中当前月，如果设置为初始选中type为全年，则第一次选中全年
            var initSelectedType = $attrs.selectedType == 'fullYear' ? 4 : 1;
            //财年需要查出来的
            //var currentYear = new Date().getFullYear();
            var currentYear = null;
            $scope.conditions = {year:currentYear};

            //TODO 是否可以数据相同？
            $scope.model.startDateObj = $scope.conditions.startMonth;
            $scope.model.endDateObj = $scope.conditions.endMonth;
            $scope.model.payDateCondtionObj = $scope.conditions;

            //初始化的下拉值
            var emptyMonth = {yearMonthStr:'请选择计酬月',id:-1};
            /**
             * 发送请求根据 选中的计酬年 查询出可选的计酬月
             * @param year
             */
            $scope.getPayDateByYear = function(year){
                $http.post(basePath +"/jyhsapportionrule/findKHGLAttendanceCycleByYear",null,{params:{year:year}}).success(function (data) {
                    if(data.status == 0){
                        $scope.payMonthList = data.result;
                        //$scope.startPayMonthList = $scope.payMonthList;
                        //$scope.endPayMonthList = $scope.payMonthList;
                        if(enableEmpty){
                            $scope.payMonthList.splice(0,0,emptyMonth);
                            //初始化选中值
                            $scope.conditions.startMonth = emptyMonth;
                            $scope.conditions.endMonth = emptyMonth;
                            //重新设置下拉的数组
                            $scope.changePayMonth('start');
                            $scope.changePayMonth('end');
                        }else{
                            //初始化当前月Id
                            getNowMonth.setMonth();
                            //默认选中当前月
                            //但在直接点击快捷选中时间按钮，但是年不为当前年，重新选中当前年，并且根据快捷选中type快捷选中，最后快捷type再变回1
                            $scope.selectChoiceDate(selectedType,true);
                            selectedType = initSelectedType;
                        }

                        //累计时间从选中年的第一个月开始算起
                        $scope.model[totalStartDate] = $scope.payMonthList[enableEmpty ? 1 : 0].startDate;
                        //累计时间从选中年的第一个月开始算起
                        $scope.model[totalEndDate] = $scope.payMonthList[$scope.payMonthList.length-1].endDate;

                        //有默认设置月方法，重新设置月
                        if($scope.resetMonth){
                            $scope.resetMonth();
                            $scope.resetMonth = null;
                        }

                    }else{
                        ynNotification.notify('error',data.message);
                    }
                });
            };

            /**
             * 计酬年的变化，查询计酬月
             */
            $scope.$watch(function(){
                return $scope.conditions.year;
            },function(value){
                if(!value){
                    return;
                }
                $scope.getPayDateByYear(value);
            });

            /**
             * 改变计酬月
             * @param key
             */
            $scope.changePayMonth = function(key){
                //放入选中区间的月对象
                var startId = $scope.conditions.startMonth.id;
                var endId = $scope.conditions.endMonth.id;
                var startIndex = startId == -1 ? 1 : enableEmpty ? parseInt(startId) : parseInt(startId)-1;
                var endIndex = endId == -1 ? $scope.payMonthList.length : enableEmpty ? parseInt(endId)+1 : parseInt(endId);
                $scope.model[monthListKey] = [];
                for(var i=startIndex;i<endIndex;i++){
                    $scope.model[monthListKey].push($scope.payMonthList[i]);
                }
                if(key == 'start'){
                    //选中的开始计酬月，则结束计酬月不能下月开始
                    $scope.model[startDate] = $scope.conditions.startMonth.startDate;
                    if($scope.conditions.startMonth.id != -1){
                        //$scope.endPayMonthList = [emptyMonth];
                        $scope.endPayMonthList = [];
                        var i = 0;
                        while(i<$scope.payMonthList.length){
                            if($scope.payMonthList[i].id >= $scope.conditions.startMonth.id || ($scope.payMonthList[i].id == -1)){
                                $scope.endPayMonthList.push($scope.payMonthList[i]);
                            }
                            //选择开始日期，结束日期中的下拉列表中只能选择>=开始的日期
                            i++;
                        }
                    }else{
                        $scope.endPayMonthList = $scope.payMonthList;
                    }
                }else if(key == 'end'){
                    //选中的开始计酬月，则结束计酬月不能下月开始
                    $scope.model[endDate] = $scope.conditions.endMonth.endDate;
                    if($scope.conditions.endMonth.id != -1){
                        //$scope.startPayMonthList = [emptyMonth];
                        $scope.startPayMonthList = [];
                        var i = 0;
                        while(i<$scope.payMonthList.length){
                            if($scope.payMonthList[i].id <= $scope.conditions.endMonth.id || ($scope.payMonthList[i].id == -1)){
                                $scope.startPayMonthList.push($scope.payMonthList[i]);
                            }
                            //选择结束日期，开始日期中的下拉列表中只能选择<=结束的日期
                            i++;
                        }
                    }else{
                        $scope.startPayMonthList = $scope.payMonthList;
                    }
                }
            };

            /**
             * 根据传入月份将开始，结束日期都选中传入的月
             * @param month
             */
            var choiceMonth = function(month,endMonth){
                $scope.model.payDateCondtionObj = $scope.conditions;
                for(var i=0;i<$scope.payMonthList.length;i++){
                    //开始时间是否已经找出
                    var startDateFind = false;
                    if(month == $scope.payMonthList[i].id){
                        $scope.conditions.startMonth = $scope.payMonthList[i];
                        $scope.model[startDate] = $scope.payMonthList[i].startDate;
                        startDateFind = true;
                    }
                    //结束时间
                    if((startDateFind && !endMonth) || (endMonth == $scope.payMonthList[i].id)){
                        $scope.conditions.endMonth = $scope.payMonthList[i];
                        $scope.model[endDate] = $scope.payMonthList[i].endDate;
                        //重新设置下拉的数组
                        $scope.changePayMonth('start');
                        $scope.changePayMonth('end');
                        break;
                    }
                }
            };


            /**
             * 获得当前月
             */
            var getNowMonth = (function(){

                var currentMonth = null;
                var currentMonthId = null;
                return {
                    getMonth:function(callback){
                        if(!callback){
                            callback = function(){};
                        }
                        if(currentMonth){
                            callback(currentMonthId);
                            return;
                        }
                        return $http.post(basePath +"/jyhsapportionrule/findSpeciCycleDate",null,{params:{type:1}}).success(function (data) {
                            if(data.status == 0){
                                var dateList = data.result.split("-");
                                if(!dateList || dateList.length < 1){
                                    throw new Error("error on selectChoiceDate,时间格式不对！");
                                }

                                $scope.conditions.year = parseInt(dateList[0]);
                                //保存一下当前财年，需要后面做比较
                                currentYear = $scope.conditions.year;

                                currentMonth = parseInt(dateList[1]);
                                //TODO 根据返回的计酬年月，做选中的操作
                            }else{
                                ynNotification.notify('error',data.message);
                            }
                        });
                    },
                    setMonth:function(){
                        //(20160426)根据Id来，不更具month来
                        for(var i in $scope.payMonthList){
                            if($scope.payMonthList[i].month == currentMonth){
                                currentMonthId = $scope.payMonthList[i].id;
                            }
                        }

                    }
                }

            })();
            getNowMonth.getMonth();

            /**
             * 选中特定时间段的计酬年月 当月，最近三个月...
             * @param type 1：当月，2：上个月，3：最近三个月，4：最近一年
             */
            var selectedType = $scope.selectedType = initSelectedType;
            $scope.selectChoiceDate = function(type,unCheck){
                //储存选中type在 getPayDateByYear 中使用
                selectedType = $scope.selectedType = type;
                //type为5，是自定义，不做任何操作
                if(type == 5) return;
                //如果使用选中特定按钮的功能时候
                if($scope.conditions.year != currentYear && !unCheck){
                    $scope.conditions.year = currentYear;
                    //储存选中type在 getPayDateByYear 中使用
                    //selectedType = $scope.selectedType = type;
                }

                //var getNowMonth = function(callback){
                //    return $http.post(basePath +"/jyhsapportionrule/findSpeciCycleDate",null,{params:{type:1}}).success(function (data) {
                //        if(data.status == 0){
                //            callback(data.result);
                //            //TODO 根据返回的计酬年月，做选中的操作
                //        }else{
                //            ynNotification.notify('error',data.message);
                //        }
                //    });
                //};
                //现在 4种类型发布获取当前月的时间，其他类型在前端进行操作
                switch (type) {
                    case 1:
                        getNowMonth.getMonth(function(data){
                            choiceMonth(data);
                        });
                        break;
                    case 2:
                        getNowMonth.getMonth(function(data){
                            var lastMonth = data - 1;
                            if(lastMonth < 1){
                                lastMonth = data;
                            }
                            choiceMonth(lastMonth,lastMonth);
                        });
                        break;
                    case 3:
                        getNowMonth.getMonth(function(data){
                            var lastMonth = data-2 >= 1 ? data-2 : data-1 >= 1 ? data-1 : data;
                            //var afterMonth = data+1 <=12 ? data+1 : data;
                            //最近三个月（当前月向前推3个月
                            choiceMonth(lastMonth,data);
                        });
                        break;
                    case 4:
                        getNowMonth.getMonth(function(data){
                            //最近一年应该取到当前月 而不是$scope.payMonthList.length
                            choiceMonth(1,data);
                        });
                        break;
                }

            };

            //注册是个事件，用于初始化选中值
            $scope.$on(($attrs.id ? $attrs.id : '') + 'InitDate',function(event,args){
                var callback = args.callback;
                var data = args.data ? args.data : args;
                if(data.startId && data.endId && data.year){
                    $scope.resetMonth = function(){
                        for(var i in $scope.payMonthList){
                            var month = $scope.payMonthList[i];
                            if(month.id == data.startId){
                                $scope.conditions.startMonth = month;
                            }
                            if(month.id == data.endId){
                                $scope.conditions.endMonth = month;
                            }
                        }
                        $scope.changePayMonth('start');
                        $scope.changePayMonth('end');
                        //调用回调函数
                        if(callback){
                            callback();
                        }
                    };
                    //改变计酬年
                    getNowMonth.getMonth(function(){
                        $scope.conditions.year = data.year;
                    });

                }

            });

        }
    }
}]);
