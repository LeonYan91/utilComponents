/**
 * project:     yineng-corpSysLand
 * title:       ynuiTreeTable
 * author:      Zhang Yongsheng
 * date:        2016/04/05 16:41
 * copyright:   2016 www.yineng.com.cn Inc. All rights reserved.
 * description: 树形表格
 */
angular.module("yn.utils").directive("ynuiTreeTable",["$http","ynNotification","$sce","$filter",'$window',function ($http,ynNotification,$sce,$filter,$window) {
    var dirConfig = {
        restrict:"AE",
        scope:{
            treeTableOption:'='
        },
        replace:false,
        templateUrl:basePath + "/scripts/components/39-ynuiTreeTable/template/ynuiTreeTable.html",
        controller:["$scope","$interval",function($scope,$interval){

        }],
        link:function($scope, $element, $attrs, $ctrls, $transcludeFn){

            $scope.tableId = $attrs.id ? $attrs.id : 'treeTableId';

            var defaultOption = {
                //查询url
                url:"",
                //查询post参数
                postParams:{},
                ////对展示的列及列名的定义
                //columnDefs:$scope.columnDefs,
                //默认不加载序号
                useSerialNumber:false,
                //默认子节点字段为children
                children:"children",
                //默认父节点字段名
                pId:"parentId",
                //默认加载数据
                autoToLoadData:true,
                //初始是否展开 默认不展开
                defaultExpand:false,
                //添加权限 默认无
                addAuth:false
            };

            $scope.treeTableOption = angular.extend(defaultOption,$scope.treeTableOption);
            //展开列角标 默认0
            var expandColumnIndex = 0;
            angular.forEach($scope.treeTableOption.columnDefs,function(data,index){
               if(data.isExpand){
                   expandColumnIndex = index;
                   if($scope.treeTableOption.useSerialNumber){
                       expandColumnIndex++;
                   }
               }
                //第一个可编辑的字段角标
                if (data.editable && !$scope.firstEditColIndex) {
                    $scope.firstEditColIndex = index;
                }
            });
            var option = {
                //theme:'vsStyle',
                expandable: true,
                stringCollapse:'收起',
                stringExpand:'展开',
                column:expandColumnIndex,
                initialState:$scope.treeTableOption.defaultExpand ? "expanded":"collapsed"
            };


            //取得每列数据
            //此方法需要绑在$scope.gridOptions是因为 此方法如果使用传入transclude模板的时候 是暴露在外面的方法
            $scope.treeTableOption.getColData = function(col,item,index){
                //如果传入有方法 上面这种写法 是可以直接在filed 上写function，但是在导出，和打印时会有影响，所以换成这种
                if(col.fieldFun){
                    return col.fieldFun(item,index);
                }else{
                    return item[col.field];
                }
            };


            /**
             * 通过节点查询上一个节点并且递归未选中节点赋值获取上一个节点方法
             * @param item 选中节点
             * @param data 递归时传来的树数据
             */
            $scope.getPreNode = function(item,data) {
                for (var i in data) {
                    if(i>0 && data[i].id==item.id && data[i-1].pId==item.pId){
                        //data[i-1].$scope.getPreNode = function(){
                        //    return $scope.getPreNode(data[i-1],data);
                        //};
                        return data[i-1];
                    }
                }
                return null;
            }

            /**
             * 通过节点查询下一个节点并且递归未选中节点赋值获取下一个节点方法
             * @param item 选中节点
             * @param data 递归时传来的树数据
             */
            $scope.getNextNode = function (item,data) {
                for (var i in data) {
                    i = parseInt(i);
                    if(i<data.length-1 && data[i].id==item.id && data[i+1].pId==item.pId){
                        //data[i+1].$scope.getNextNode = function(){
                        //    return $scope.getNextNode(data[i+1],data);
                        //};
                        return data[i+1];
                    }
                }
                return null;
            }

            /**
             * 获取节点的父节点
             * @param item 节点对象
             */
            $scope.getParentNode = function (item) {
                if(item.pId) {
                    for (var i in $scope.treeTableOption.viewData) {
                        if ($scope.treeTableOption.viewData[i].id == item.pId) {
                            return $scope.treeTableOption.viewData[i];
                        }
                    }
                }
                return null;
            }

            /**
             * 初始化节点方法
             * @param item 节点对象
             * @param data 树对象
             */
            $scope.initNodeFunction = function (item,data){
                //获取上一个节点
                item.getPreNode = function () {
                    return $scope.getPreNode(item,data);
                };
                //获取下一个节点
                item.getNextNode = function() {
                    return $scope.getNextNode(item,data);
                }
                //获取父节点
                item.getParentNode = function() {
                    return $scope.getParentNode(item);
                }
            }

            /**
             * 初始化树方法
             * @param data 转换成list之后的数据
             */
            $scope.initTreeFunction = function (data){
                //通过ID获取节点
                $scope.treeTableOption.getNode = function(id){
                    if(id){
                        for (var i in data) {
                            if(data[i].id == id){
                                return data[i];
                            }
                        }
                    }
                    return null;
                }
                //移除节点
                $scope.treeTableOption.removeNode = function (id) {
                    $("#" + $scope.tableId).treetable('removeNode',id);
                    $scope.treeTableOption.selectNode = null;
                }
                /**
                 * 展开或收起全部节点
                 * @param flag true为展开false为收起 默认为tree
                 */
                $scope.treeTableOption.expandAll = function(flag){
                    flag = flag==undefined ? true:flag;
                    if(flag) {
                        $("#" + $scope.tableId).treetable('expandAll');
                    }else {
                        $("#" + $scope.tableId).treetable('collapseAll');
                    }
                }
            }

            /**
             * 点击节点时事件
             * @param item
             */
            $scope.clickNode = function(item){
                $scope.treeTableOption.selectNode = item;
                //$scope.treeTableOption.removeNode(item.id)
            }


            /**
             * 点击编辑
             * @param col 列对象
             * @param item 行对象
             */
            $scope.clickEdit = function(col,item) {
                //设置前置回调
                if(angular.isFunction($scope.treeTableOption.clickBefore) && !$scope.treeTableOption.clickBefore(col, item)){
                    return ;
                }
                //正处于编辑状态，返回
                if(item.editFlag) return;
                $scope.treeTableOption.oldItem = angular.copy(item);
                if (col.editable && !$scope.hasEditingFlag) {
                    //进入编辑状态
                    $scope.hasEditingFlag = true;
                    col.editFlag = true;
                    item.editFlag = true;
                    setTimeout(function(){
                        $("#"+item.id+col.field)[0].focus();
                    },300);
                }
            }

            /**
             * 添加新节点
             * @param col 列对象
             * @param newTaskName 节点name
             */
            $scope.addNewNode = function(col,newTaskName){
                if (!newTaskName || newTaskName.length==0) {
                    ynNotification.notify("error","请输入" + col.displayName + "！");
                    return;
                }
                //调用配置的增加方法
                if($scope.treeTableOption.addNewNode) {
                    //返回添加前的最后一个对象 处理排序
                    var item = null;
                    if ($scope.treeTableOption.data && $scope.treeTableOption.data.length>0) {
                        item = $scope.treeTableOption.data[$scope.treeTableOption.data.length - 1];
                    }
                    $scope.treeTableOption.addNewNode(item,newTaskName);
                }
            }

            //内容未改变时 不处理
            $scope.editAction = function(col,item){
                if($scope.treeTableOption.blurEdit && item[col.field] != $scope.treeTableOption.oldItem[col.field]) {
                    var http = $scope.treeTableOption.blurEdit(item,col);
                    //请求失败时还原数据
                    if (http) {
                        http.then(function(data){
                            if (data.status!=200){
                                item[col.field] = $scope.treeTableOption.oldItem[col.field];
                            } else {
                                if (data.data && data.data.status!=0) {
                                    item[col.field] = $scope.treeTableOption.oldItem[col.field];
                                }
                            }
                        });
                    }
                }
            };
            /**
             * 编辑框失焦
             * @param col 列对象
             * @param item 行对象
             */
            $scope.blurEdit = function(col,item) {
                $window.setTimeout(function(){
                    var setEditFlag = function(){
                        $scope.hasEditingFlag = false;
                        col.editFlag = false;
                        item.editFlag = false;
                    };
                    if (!item.taskName || item.taskName.length==0) {
                        ynNotification.notify("error","请输入" + col.displayName + "！");
                        return;
                    }
                    if(angular.isFunction($scope.treeTableOption.blurBefore) && !$scope.treeTableOption.blurBefore(col, item)){
                        //编辑状态结束  其他节点可编辑
                        item[col.field] = $scope.treeTableOption.oldItem[col.field];
                        setEditFlag();
                        $scope.$apply();
                        return ;
                    }
                    $scope.editAction(col,item);
                    //编辑状态结束  其他节点可编辑
                    setEditFlag();
                },750);

            };
            //初始化角标
            var index = 1;
            /**
             * 将树结构数据重组为list
             * @param source 源对象--树形结构
             * @param data 目标对象--调用时必须初始化为空长度数组
             * @param pId 父节点ID 递归时才有
             */
            $scope.regroupData = function (source,data,pId){
                angular.forEach(source,function(sou){
                    sou.index = index++;
                    //默认使用用户配置的父节点ID
                    if (sou[$scope.treeTableOption.pId] != undefined) {
                        sou.pId = sou[$scope.treeTableOption.pId];
                    }else {
                        sou.pId = pId;
                    }
                    $scope.initNodeFunction(sou,source);
                    data.push(sou);
                    if (sou[$scope.treeTableOption.children] && sou[$scope.treeTableOption.children].length>0) {
                        $scope.regroupData(sou[$scope.treeTableOption.children],data,sou.id);
                    }
                })
            }

            /**
             * 加载数据
             * @param id 如果有该参数 则选中
             */
            $scope.treeTableOption.loadData = function(id){
                $scope.showFlag = false;
                //每次刷新时 初始化角标
                index = 1;
                //正在加载
                ynNotification.notify("info","正在加载...");

                var config = {
                    url:basePath + $scope.treeTableOption.url,
                    method:"POST",
                    data:$scope.treeTableOption.postParams
                };

                $http(config).success(function(data){
                    //清除正在加载
                    ynNotification.notifyClear();
                    $scope.showFlag = true;
                    $scope.treeTableOption.data = data;
                    $scope.treeTableOption.viewData = [];
                    $scope.regroupData($scope.treeTableOption.data,$scope.treeTableOption.viewData);
                    $scope.initTreeFunction($scope.treeTableOption.viewData);
                    //初始化树
                    setTimeout(function(){
                        if (id) {
                            angular.forEach($scope.treeTableOption.viewData, function (data) {
                                if (data.id == id) {
                                    $scope.treeTableOption.selectNode = data;
                                }
                            });
                        }
                        $("#" + $scope.tableId).treetable(option);
                    },0)
                }).error(function(){
                    ynNotification.notifyClear();
                    $scope.treeTableOption.loading = {loadingError:true,msg:"获取数据失败！"};
                })
            };

            //第一次进来，加载数据
            if($scope.treeTableOption.autoToLoadData){
                $scope.treeTableOption.loadData();
            }

            /**
             * 开放给外部刷新dataGrid使用的
             * @param url 获取url的方法
             * @param param 获取post请求参数的方法
             */
            $scope.treeTableOption.refreshGrid = function(url,param){
                //根据传过来的参数重新生成查询地址和条件
                $scope.treeTableOption.url = url ? url:$scope.treeTableOption.url;
                $scope.treeTableOption.postParams = param ? param:$scope.treeTableOption.postParams;
                //重新获取数据
                $scope.treeTableOption.loadData();
            };
            /**
             * 开放给外部刷新并且选中一个节点使用
             * @param id 节点ID
             */
            $scope.treeTableOption.refreshAndSelected = function(id){
                //重新获取数据
                $scope.treeTableOption.loadData(id);
            };
            /**
             * 根据ID编辑某个节点
             * @param id 节点ID
             */
            $scope.treeTableOption.editNode = function(id){
                if ($scope.treeTableOption.selectNode) {
                    $scope.treeTableOption.selectNode = $scope.treeTableOption.getNode($scope.treeTableOption.selectNode.id);
                }
                if ($scope.firstEditColIndex!=undefined && $scope.firstEditColIndex!=null) {
                    $scope.clickEdit($scope.treeTableOption.columnDefs[$scope.firstEditColIndex],$scope.treeTableOption.getNode(id));
                }
            };
        }
    };

    return dirConfig;
}]);
