/**
 * Created by YN on 2015/6/11.
 */


angular.module("yn.utils").directive('ynuiDataGrid', ["$http","ynModal","$timeout","ynNotification","$location","$window","$sce","$interpolate","localStorageService",function($http,ynModal,$timeout,ynNotification,$location,$window,$sce,$interpolate,localStorageService) {
    return {
        restrict : 'AE',
        templateUrl : basePath + '/static/yineng/components/21-ynuiDataGrid/template/ynuiDataGrid.html',
        scope : {
            gridOptions : '='
        },
        transclude:true,
        replace : true,
        controller:function($scope, $element){
        },
        link : function($scope, $element, $attrs, ctrls) {

            //将basePath存放在指令的$scope上，是为了直接写{{basePath}}
            $scope.basePath = basePath;


            //默认初始配置
            var defaultOptions = {
//                //获得数据集的URL
//                listUrl:$scope.getUrl(),
                //post请求中的参数
                postParams:{},
                //对展示的列及列名的定义
                columnDefs:$scope.columnDefs,
                //第几页
                pageNumber:0,
                //每一页上的数据数量
                pageSize:20,
                //可选页数
                pageSizes:[20,50,100,200],
                //行操作
                rowActions:$scope.rowActions,
                topActions:$scope.topActions,
                bottomActions:$scope.bottomActions,
                //使用导出，默认开启
                useExport:true,
                //导出所选
                exportSelected:$scope.exportSelected,
                //导出全部
                exportAll:$scope.exportAll,
                //使用打印，默认关闭
                usePrint:false,
                //默认排序字段
                //sortField:"id",,
                //使用上部翻页，以及以及上部的列隐藏功能（默认开启）
                useAbovePagination:true,
                //使用下部翻页（默认开启）
                useBelowPagination:true,
                clickRow:$scope.clickRow,
                //是否使用checkBox，默认开启
                useCheckBox:true,
                //是否显示操作栏，默认开启
                useOperate:true,
                //是否使用序号，默认开启
                useIndex:true,
                //主键，在进行批量操作时，重组进数组的字段，默认为“id”
                primaryKey:"id",
                //是否全选
                allChecked:"notall",
                //是否使用transclude,指是否自己化中间的页面，可以操作性强，默认关闭
                useTransclude:false,
                //默认是开始第一次加载数据
                initData:true,
                //默认是打印全部时是全部的数据，而不是本页的数据
                printAll:true,
                //默认显示选择每一页上的数据数量
                usePageSizes:true,
                //是否使用跳转到首页和末页（默认开启）
                useToFirstAndLast:true
            };

            //将使用者转入的参数对象与默认参数合并
            $scope.gridOptions = angular.extend(defaultOptions,$scope.gridOptions);

            //导出方法（通过这一层好判断是否 没有可以导出的数据）
            $scope.gridOptions.dataGridExportAll = function(fields){
                if(!$scope.gridOptions.viewData || $scope.gridOptions.viewData.length == 0){
                   ynNotification.notify("error","没有可以导出的数据！");
                }else{
                   $scope.gridOptions.exportAll(fields);
                }
            };

            //加载信息对象，记录加载情况
            $scope.gridOptions.loading = {
                isLoading:true,
                loadingError:false
            };

            //加载数据提示
            $scope.gridOptions.loading = {
                loadingError:false,//加载失败
                isLoading:false,//正在加载
                msg:'获取数据失败！'//加载失败的提示信息
            };
            /**
             * 加载数据
             * @param conf 可自行传入加载数据的配置，不传则默认按照默认的发送方式
             */
            $scope.gridOptions.loadData = function(conf){
                //正在加载
                ynNotification.notify("info","正在加载...");

                $scope.gridOptions.loading.isLoading = true;
                $scope.gridOptions.loading.loadingError = false;
//                $scope.gridOptions.viewData = [];

                //显示正在加载
                $scope.gridOptions.loading.isLoading = true;
                var config = !conf ? {
                    url:basePath + $scope.gridOptions.listUrl,
                    method:"POST",
                    params:{pageNumber:$scope.gridOptions.pageNumber,pageSize:$scope.gridOptions.pageSize},
                    data:$scope.gridOptions.postParams
                } : conf;
                config.url = encodeURI(decodeURI(config.url));
                $http(config).success(function(data){
                    //初始化展示数据数组 将数据重新放入一个数组，主要是为了不污染原来的数据
                    $scope.gridOptions.viewData = [];
                    if(data.status == 0){
                        //刷新dataGrid初始化部分参数
                        $scope.gridOptions.allChecked = "notall";//刷新，不全选

                        if($scope.gridOptions.rowspanConfig){
                            $scope.gridOptions.rowspanProtoData = data.result.content;
                            //TODO 测试合并单元格数据，需要测试合并单元格时就打开这句话，用生成的复杂数据测试
//                            $scope.gridOptions.rowspanProtoData = generDemoData();
                            $scope.initRowspanData($scope.gridOptions.rowspanProtoData);
                        }
                        $scope.gridOptions.loading.isLoading = false;

                        $scope.gridOptions.data = data.result;

                        if($scope.gridOptions.data) {
                            angular.forEach($scope.gridOptions.data.content, function (d) {
                                //放入一个新的数组，默认为不勾选
                                var data = {item: d, selectedFlag: 'no'};
                                $scope.gridOptions.viewData.push(data);
                            });
                        }
                    }else{
                        //如果加载失败，显示加载失败信息
                        $scope.gridOptions.loading.isLoading = false;
                        //加载失败
                        $scope.gridOptions.loading.loadingError = true;
                        $scope.gridOptions.loading.msg = '获取数据失败！';
                    }
                    //清除正在加载
                    var loadInfo = $timeout(function(){
                        ynNotification.notifyClear();
                        $timeout.cancel(loadInfo);
                    }, 200);
                }).error(function(){
                    //即使加载失败也应该初始化展示数据数组,主要是清楚上次可能加载的数据
                    $scope.gridOptions.viewData = [];
                    //加载失败
                    $scope.gridOptions.loading.loadingError = true;
                    $scope.gridOptions.loading.msg = '获取数据失败！';
                });

            };

            //第一次进来，默认加载，则加载数据。第一次默认是开启加载数据的功能，手动关闭
            if($scope.gridOptions.initData){
                $scope.gridOptions.loadData();
            }

            //取得每列数据
            //此方法需要绑在$scope.gridOptions是因为 此方法如果使用传入transclude模板的时候 是暴露在外面的方法
            $scope.gridOptions.getColData = function(col,item){
                //看field是否是string 兼容之前写的组件
//                if(typeof(col.field) === 'string'){
//                    return item[col.field];
//                }else{
//                    //如果不是string 则是方法，可以适用于显示对象下面的属性
//                    //有可能是传入的input等HTML代码，进行转换
//                    $scope.rowData = item;
//                    return $sce.trustAsHtml($interpolate(col.field(item))($scope));
//                }
                //如果传入有方法 上面这种写法 是可以直接在filed 上写function，但是在导出，和打印时会有影响，所以换成这种
                if(col.fieldFun){
                    return col.fieldFun(item);
                }else{
                    return item[col.field];
                }
            };

            //翻左页
            $scope.toLeftPage = function(){
                if(!($scope.gridOptions.data.number <= 0)){
                    $scope.gridOptions.pageNumber -= 1;
                    $scope.gridOptions.loadData();
                }
            };
            //翻右页
            $scope.toRightPage = function(){
                if(!($scope.gridOptions.data.number+1 >= $scope.gridOptions.data.totalPages)){
                    $scope.gridOptions.pageNumber += 1;
                    $scope.gridOptions.loadData();
                }
            };

            /**
             * 跳转到指定的页数
             * @param page  需要跳转的页数
             */
            $scope.jumpPage = function(page){
                // 在与运算中的最后一个是判断 如果需要跳转的页数与当前所在的页面相同，则不进行表格刷新
                if(page>=1 && page<=$scope.gridOptions.data.totalPages && page != ($scope.gridOptions.data.number+1)){
                    $scope.gridOptions.pageNumber = page-1;
                    $scope.gridOptions.loadData();
                }
            };

            /**
             * 切换每页显示的数据条数
             * @param size
             */
            $scope.switchPageSize = function(size){
                $scope.gridOptions.pageNumber = 0;
                $scope.gridOptions.pageSize = size;
                $scope.gridOptions.loadData();
            };

            //取得所选数据的所有主键数组（默认主键是"id"），老版的dataGrid就是如此设计得，兼容以前的写法
            //并且获取选中的对象数组
            $scope.getSelectedPrimaryKey = function(){
                var keys = [];
                $scope.selectedData = [];
                if($scope.gridOptions.rowspanConfig){
                    var stru = $scope.gridOptions.rowspanConfig.structure;
                    //合并单元格时checkBox操作的对象数组
                    var actionData = !stru.minActionType ? $scope.gridOptions.rowspanProtoData : stru.minObjList;
                    //如果目前是rowspan合并单元格模式
                    angular.forEach($scope.gridOptions.rowspanConfig.structure.checkBoxArray,function(item){
                        if(item.selectedFlag == 'yes'){
                            keys.push(actionData[item.index-1][$scope.gridOptions.primaryKey]);
                        }
                    });
                }else{
                    angular.forEach($scope.gridOptions.viewData,function(item){
                        if(item.selectedFlag == 'yes'){
                            keys.push(item.item[$scope.gridOptions.primaryKey]);
                        }
                    });
                }

                return keys;
            };

            //选择所选id暴露出去
            $scope.gridOptions.getSelectedPrimaryKey = function(){
                return $scope.getSelectedPrimaryKey();
            };

            //选择所选数据暴露出去
            $scope.gridOptions.getSelectedData = function(){
                return $scope.getSelectedData();
            };

            //取得所选的数据，和所有的数据
            $scope.getSelectedData = function(){
                //选中的对象
                var selectedObj = [];
                var allData = null;
                if($scope.gridOptions.rowspanConfig){
                    var stru = $scope.gridOptions.rowspanConfig.structure;
                    //合并单元格时checkBox操作的对象数组
                    var actionData = !stru.minActionType || stru.minActionType != 'all' ? $scope.gridOptions.rowspanProtoData : stru.minObjList;
                    allData = $scope.gridOptions.rowspanProtoData;
                    //如果是rowspan合并单元格模式
                    angular.forEach($scope.gridOptions.rowspanConfig.structure.checkBoxArray,function(item){
                        if(item.selectedFlag == 'yes'){
                            selectedObj.push(actionData[item.index-1]);
                        }
                    });
                }else{
                    if($scope.gridOptions.data){
                        allData = $scope.gridOptions.data.content;
                    }
                    angular.forEach($scope.gridOptions.viewData,function(item){
                        if(item.selectedFlag == 'yes'){
                            //将选中的对象放入选中对象数组
                            selectedObj.push(item.item);
                        }
                    });
                }


                var option = {
                    allData:allData,
                    selectedData:selectedObj
                };

                return option;
            };

            //全选/反全选
            //此方法需要绑在$scope.gridOptions是因为 此方法如果使用传入transclude模板的时候 是暴露在外面的方法
            $scope.gridOptions.checkAll = function(all){
                var check = (all == 'all') ? 'yes' : 'no';
                if($scope.gridOptions.rowspanConfig){
                    //如果目前的模式是rowspan合并单元格
                    for(i in $scope.gridOptions.rowspanConfig.structure.checkBoxArray){
                        var box = $scope.gridOptions.rowspanConfig.structure.checkBoxArray[i];
                        box.selectedFlag = check;
                    }
                }else{
                    angular.forEach($scope.gridOptions.viewData,function(item){
                        //如果此列没有被禁止选择才能被全选勾中
                        if(!($scope.gridOptions.disableCheckBox && $scope.gridOptions.disableCheckBox(item.item))){
                            item.selectedFlag = check;
                        }
                    });
                }

            };

            //checkBox点击一行时的事件
            //此方法需要绑在$scope.gridOptions是因为 此方法如果使用传入transclude模板的时候 是暴露在外面的方法
            $scope.gridOptions.selectRow = function(row){
                if(row.selectedFlag === 'no'){
                    //如果反选一行，肯定应该把全选的反选
                    $scope.gridOptions.allChecked = 'notall';
                }else{
                    var isAll = 'all';
                    if($scope.gridOptions.rowspanConfig){
                        //如果目前的模式是rowspan合并单元格
                        for(i in $scope.gridOptions.rowspanConfig.structure.checkBoxArray){
                            var box = $scope.gridOptions.rowspanConfig.structure.checkBoxArray[i];
                            if(box.selectedFlag === 'no'){
                                isAll = 'notall';
                                //有一个不是选中的，不全选
                                break;
                            }
                        }
                    }else{
                        //需要用到break 所以用原生的for循环，不用angular.forEach
                        for(i in $scope.gridOptions.viewData){
                            if($scope.gridOptions.viewData[i].selectedFlag === 'no'){
                                isAll = 'notall';
                                //有一个不是选中的，不全选
                                break;
                            }
                        }
                    }
                    $scope.gridOptions.allChecked = isAll;

                }
            };

            //取得所有选中的filed
            $scope.getSelectedField = function(){
                var selectedField = [];
                angular.forEach($scope.gridOptions.columnDefs,function(item){
                    if(item.columnSelectFlag === 'yes'){
                        selectedField.push(item);
                    }
                });
                return selectedField;
            };

            //将获取选中区域的方法暴露出去
            $scope.gridOptions.getSelectedField = function(){
                return $scope.getSelectedField();
            };

            //取得行 长度，主要在显示“加载中...”这些时 能显示正常
            //此方法需要绑在$scope.gridOptions是因为 此方法如果使用传入transclude模板的时候 是暴露在外面的方法
            $scope.gridOptions.getColLength = function(){
                var selectedField = [];
                angular.forEach($scope.gridOptions.columnDefs,function(item){
                    if(item.columnSelectFlag === 'yes'){
                        selectedField.push(item);
                    }
                });
                var length = selectedField.length;
                //序号加1长度
                length += 1;
                //使用checkBox 加1 长度
                if($scope.gridOptions.useCheckBox){
                    length += 1;
                }
                //使用操作 加1 长度
                if($scope.gridOptions.useOperate){
                    length += 1;
                }
                return length;
            };

            //重新刷新dataGrid，初始化数据
            $scope.initGridParams = function(){
                //重新刷新dataGrid，清除所有的排序
                $scope.currentSortField = null;
                $scope.sortOrder = null;
                $scope.gridOptions.currentSortBy = null;

                //重新跳到第一页
                $scope.gridOptions.pageNumber = 0;
                //重新获取数据
                $scope.gridOptions.loadData();
            };

            /**
             * 开放给外部刷新dataGrid使用的
             * @param url 获取url的方法
             * @param param 获取post请求参数的方法
             */
            $scope.gridOptions.refreshGrid = function(url,param){
                //根据传过来的参数重新生成查询地址和条件
                $scope.gridOptions.listUrl = url;
                $scope.gridOptions.postParams = param ? param:{};

                //初始化数据，刷新
                $scope.initGridParams();
            };

            //兼容以前的写法
            //相应外部传入的请求重载数据列表的办法
            $scope.$on("reloadDataEvent",function(event,options){
                //根据传过来的参数重新生成查询地址和条件
                $scope.gridOptions.listUrl = options.searchUrl;
                $scope.gridOptions.postParams = options.postParams;

                //初始化数据，刷新
                $scope.initGridParams();
            });

            /**
             * 排序算法
             * @param field 需要排序的字段
             * @returns {Function}
             */
            $scope.by = function(field){
                return function(o,p){
                    var a, b;
                    if(typeof o === "object" && typeof p === "object" && o && p) {
                        //这里排的是对象下面的item对象，这是因为此排序是专门针对ynuiDataGrid的viewData排序的
                        a = o.item[field];
                        b = p.item[field];
                        if(a === b) {
                            return 0;
                        }
                        if (typeof a === typeof b) {
                            return a > b ? 1 : -1;
                        }
                        return typeof a > typeof b ? 1 : -1;
                    }else{
                        throw("error");
                    }
                }
            }
            /**
             * 排序
             * @param column 目前需要排序的列
             * @param $event
             */
            $scope.gridOptions.sortDataList = function(column,$event){
                if($scope.currentSortField != column.field){
                    $scope.currentSortField = column.field;
                    $scope.sortOrder = 'asc';
                    //开始排序
                    if($scope.gridOptions.viewData && !column.backSort){
                        $scope.gridOptions.viewData.sort($scope.by($scope.currentSortField));
                    }
                }else{
                    $scope.sortOrder = $scope.sortOrder == 'asc' ? 'desc' : 'asc';
                    //和上次点击的同一个字段排序，直接反转数组
                    if($scope.gridOptions.viewData && !column.backSort){
                        $scope.gridOptions.viewData.reverse();
                    }
                }
                if(column.backSort){
                    var sortObj = {sortField:column.backSort,sortOrder:$scope.sortOrder};
                    angular.extend($scope.gridOptions.postParams,sortObj);
                    //如果是后台排序
                    $scope.gridOptions.loadData();
                }
                $scope.gridOptions.currentSortBy = $scope.currentSortField + "_" +$scope.sortOrder;
            };

            //激活行点击事件
            $scope.activeRowAction = function(rowAct,row){
                if(!(rowAct.useable && !rowAct.useable(row.item))){
                    rowAct.action(row.item);
                }
            };
            //激活(top, buttom)按钮
            $scope.activeButtom = function(buttAct){
                if(!(buttAct.useable && !buttAct.useable())){
                    buttAct.action($scope.getSelectedPrimaryKey(),$scope.getSelectedData());
                }
            };
            /*********打印开始  直接延用以前的************/
            //打印数据表格所选
            $scope.dataGrid_printSelected = function(){
                //如果是合并单元格，把合并单元格的信息传过去
                localStorageService.set("ynuiDataPrintRowspanStructure",$scope.gridOptions.rowspanConfig);

                var ids = $scope.getSelectedPrimaryKey();
                var selectedFields = $scope.getSelectedField();
                if(ids.length < 1){
                    ynNotification.notify("error","请至少勾选一项！");
                    return;
                }
                var strArray = new Array();
                angular.forEach(selectedFields, function(item){
                    strArray.push(item.field + "@" + item.displayName);
                });
                window.open(basePath + "/static/yineng/components/21-ynuiDataGrid/template/ynuiPrint.html?printAll="
                    + "n" + "&pageSize=" + $scope.gridOptions.pageSize + "&pageNumber=" + ($scope.gridOptions.pageNumber+1)
                    + "&pageTitle=" + $scope.gridOptions.printConfig.title + "&url=" + $scope.gridOptions.printConfig.printSelectedReqUrl + "&columns=" + strArray.join("^"),ids.join(","));
            };
            //1、打印本页全部2、或者根据查询条件打印所有的数据
            $scope.dataGrid_printAll = function(){
                //如果是合并单元格，把合并单元格的信息传过去
                localStorageService.set("ynuiDataPrintRowspanStructure",$scope.gridOptions.rowspanConfig);

                //如果需要打印全部则pageSize设置为最大，否则设置为当前size,默认是打印全部
                var pageSize = $scope.gridOptions.printAll ? 99999 : $scope.gridOptions.pageSize;
                //打印全部时pageNumber从第一页开始
                var pageNumber = $scope.gridOptions.printAll ? 1 : ($scope.gridOptions.pageNumber+1);

                //打印全部将请求条件放在cookie中
                localStorageService.set("ynuiDataPrintConditions",$scope.gridOptions.postParams);
                var selectedFields = $scope.getSelectedField();
                var strArray = new Array();
                angular.forEach(selectedFields, function(item){
                    strArray.push(item.field + "@" + item.displayName);
                });
                window.open(basePath + "/static/yineng/components/21-ynuiDataGrid/template/ynuiPrint.html?printAll="
                    + "y" + "&pageSize=" + pageSize + "&pageNumber=" + pageNumber + "&pageTitle="
                    + $scope.gridOptions.printConfig.title + "&url=" + (basePath+$scope.gridOptions.listUrl) + "&columns=" + strArray.join("^"));
            };

            //将打印全部和打印所选暴露给外部使用
            $scope.gridOptions.dataGrid_printSelected = function(){
                $scope.dataGrid_printSelected();
            };
            $scope.gridOptions.dataGrid_printAll = function(){
                $scope.dataGrid_printAll();
            };
            /*********打印结束  直接延用以前的************/



            /********************* rowspan合并单元格 START ********************/

            //格式化rowspan隐藏列，等功能需要的初始数据
            $scope.initRowspanRequiredData = function(){
                //初始化columnDefs
                $scope.rowspanDefs = {};
                angular.forEach($scope.gridOptions.columnDefs,function(item){
                    $scope.rowspanDefs[item.field] = !item.columnSelectFlag ? "yes" : item.columnSelectFlag;
                });
                //是否用checkBox
                $scope.gridOptions.rowspanConfig.structure.useCheckBox = $scope.gridOptions.useCheckBox;
                $scope.rowspanDefs["checkBox"] = $scope.gridOptions.useCheckBox ? "yes" : "no";
                //是否使用操作栏
                $scope.rowspanDefs["operation"] = $scope.gridOptions.useOperate ? "yes" : "no";
                //是否使用序号
                $scope.rowspanDefs["index"] = $scope.gridOptions.useIndex ? "yes" : "no";
                //在第一层属性上生成index 属性
                if(!$scope.gridOptions.rowspanConfig.structure.minActionType || $scope.gridOptions.rowspanConfig.structure.minActionType != 'all'){
                    //正常情况下需要加上index字段，如果是按最后对象最准，则不需要加
                    $scope.gridOptions.rowspanConfig.structure.property[0].splice(0,0,"index");
                }
                //生成行内事件
                $scope.gridOptions.rowspanConfig.structure.rowActions = $scope.gridOptions.rowActions;


            };

            if($scope.gridOptions.rowspanConfig){
                $scope.initRowspanRequiredData();
            }

            //格式化rowspan的数据
            $scope.initRowspanData = function(sourceData){
                $scope.gridOptions.rowspanData = generRowSpanForDataGird(sourceData,$scope.gridOptions.rowspanConfig.structure);
            };

            //此方法主要是服务与在合并单元格时需要列的隐藏显示操作
            $scope.changeColumnSelectFlag = function(item){
                $scope.rowspanDefs[item.field] = item.columnSelectFlag;
            };


            /********************* rowspan合并单元格 END ********************/



        }
    }
}]);






//模板编译指令，以及trusted Template过滤器
angular.module("yn.utils")
    //重新编译模板
    .directive('compileTemplate', ['$compile', '$parse',
        function($compile, $parse) {
            return {
                restrict: 'A',
                link: function(scope, element, attr, ctrl) {
                    var parsed = $parse(attr.ngBindHtml);

                    function getStringValue() {
                        return (parsed(scope) || '').toString();
                    };
                    //监听模板变化，重新编译
                    scope.$watch(getStringValue, function() {
                        $compile(element, null, -9999)(scope);
                    });
                }
            }
        }
    ])

    //模板转义
    .filter('to_trusted', ['$sce',
        function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            }
        }
    ])


;







/***********************  rowspan数据生成方法  为了适应dataGrid 在原来的工具方法上进行了修改  *******************************/

/**
 *
 * @param sourceList
 * @param structure
 * @returns {Array}
 */
var generRowSpanForDataGird = function(sourceList,structure){

    //初始化checkBox选择数据
    structure.checkBoxArray = [];

    //如果需要 生成最下面一行的统计数据
    structure.staConfigArray = {};
    for(var i in structure.statisticConfig){
        var config = structure.statisticConfig[i];
        if(config.childDeep != undefined && config.childDeep != null){
            if(!structure.staConfigArray[config.childDeep]){
                structure.staConfigArray[config.childDeep] = [];
            }
            //初始数据
            config.sum = 0;
            structure.staConfigArray[config.childDeep].push(config);
        }
    }

    //结果数组
    var resultList = [];
    //无论是否使用“序号”，都应该给起第一层数据产生个index序号的概念，行内事件需要使用到
    if(!structure.minActionType || structure.minActionType != 'all'){
        for(var i in sourceList){
            var item = sourceList[i];
            item.index = parseInt(i)+1;
        }
    }
    if(structure.minActionType){
        //最后对象的存放数组
        structure.minObjList = [];
        //以最小对象计算index
        var minIndex = 0;
        var minIndexChBox = 0;
    }


    //递归，生成想要的数据
    var recurList = function(sourceList,deep,faList){
        //属性数组
        var property = structure.property[deep];
        //子属性数组
        var child = structure.children[deep];
        //统计行
        var staConfigArray = structure.staConfigArray[deep];
        //开始一层的递归，+1计算出当前的递归层级
        deep += 1;
        //此次递归时在遍历sourceList所产生的结果rowSpan
        var rowspan = 0;

        if(sourceList && sourceList.length > 0){
            //当源数组存在时才执行property获取
            for(var i in sourceList){
                var currentItem = sourceList[i];
                var currentFaList = null;
                //此数组是用来临时方法此deep中产此次循环参数的数据，然后用于在数据中添加rowSpan
                var rowCalList = [];
                if(i==0 && faList){
                    currentFaList = faList;
                }else{
                    var newedList = [];
                    resultList.push(newedList);
                    currentFaList = newedList;
                }
                //开始向数组中放数据
                for(j in property){
                    var obj = {value:currentItem[property[j]],rowspan:1,property:property[j]};
                    rowCalList.push(obj);
                    currentFaList.push(obj);
                }
                if(currentItem[child] && currentItem[child].length > 0){
                    //如果子对象存在
                    var curChiRowSpan = recurList(currentItem[child],deep,currentFaList);
                    //重新给此次加入currentFaList增加对象赋予rowSpan
                    for(k in rowCalList){
                        rowCalList[k].rowspan = curChiRowSpan;
                    }
                    rowspan += curChiRowSpan;
                }else{
                    if(deep < structure.children.length){
                        recurList(null,deep,currentFaList);
                    }
                    rowspan += 1;
                }

                //开始生成统计数据
                for(var l in staConfigArray){
                    var config = staConfigArray[l];
                    config.sum += !currentItem[config.property] ? 0 : parseInt(currentItem[config.property]);
                }

                //如果有启用rowAction 行内点击事件，当然只放入在第一层的数组对象中
                //structure.minActionType 为true时，则以最后的单位为标准放置按钮
                if(structure.rowActions && deep==1 && !structure.minActionType){
                    //actionList是重组后的行内事件数组，index是存放当前操作栏是deep==0，就第一层数组所在的位置
                    var rowActionCol = {actionList:[],rowspan:curChiRowSpan,index:sourceList[i].index,property:"operation"};
                    //开始循环rowAction，重组行内事件数组
                    for(var r in structure.rowActions){
                        var item = structure.rowActions[r];
                        var action = {
                            name:item.name(currentItem),
                            auth:item.auth,
//                            action:function(index){
//                                //为什么不直接使用item.action(currentItem) 因为是无效的，只能通过传入index的方式
//                                structure.rowActions[0].action(sourceList[index]);
//                            }
                            action:item.action,
                            useable:item.useable
                        };
                        rowActionCol.actionList.push(action);
                    }
                    currentFaList.push(rowActionCol);
                }
                if(structure.rowActions && deep==structure.property.length && structure.minActionType){
                    var minIn = ++minIndex;
                    //将此对象存放在
                    structure.minObjList.push(currentItem);
                    //actionList是重组后的行内事件数组，index是存放当前操作栏是deep==0，就第一层数组所在的位置
                    var rowActionCol = {actionList:[],rowspan:1,index:minIn,property:"operation"};
                    //index序号放置数组首位
                    //!!需求变更，此处不需要以最小单位为准在头部放index了,checkBox，与操作需要，但是index序号是以最大数据为准的
                    if(structure.minActionType == 'all'){
                        var obj = {value:minIn,rowspan:1,property:"index"};
                        currentFaList.splice(0,0,obj);
                    }
                    //开始循环rowAction，重组行内事件数组
                    for(var r in structure.rowActions){
                        var item = structure.rowActions[r];
                        var action = {
                            name:item.name(currentItem),
                            auth:item.auth,
//                            action:function(index){
//                                //为什么不直接使用item.action(currentItem) 因为是无效的，只能通过传入index的方式
//                                structure.rowActions[0].action(sourceList[index]);
//                            }
                            action:item.action,
                            useable:item.useable
                        };
                        rowActionCol.actionList.push(action);
                    }
                    currentFaList.push(rowActionCol);
                }

                //如果有启用checkBox 并且 不是以最小单位为标准的模式
                if(structure.useCheckBox && deep==1 && !structure.minActionType){
                    var boxObj = {selectedFlag:"no",rowspan:curChiRowSpan,index:sourceList[i].index,property:"checkBox"};
                    //将checkBox放在第一位
                    currentFaList.splice(0,0,boxObj);
                    //在其他地方也存放一下这个checkBox数组对象，用户操作
                    structure.checkBoxArray.push(boxObj);
                }
                //如果有启用checkBox 并且 以最小单位
                if(structure.useCheckBox && deep==structure.property.length && structure.minActionType){
                    var minIn = ++minIndexChBox;
                    var boxObj = {selectedFlag:"no",rowspan:1,index:minIn,property:"checkBox"};
                    //将checkBox放在第一位
                    currentFaList.splice(0,0,boxObj);
                    //在其他地方也存放一下这个checkBox数组对象，用户操作
                    structure.checkBoxArray.push(boxObj);
                }


            }
        }else{
            //如果是第一层就进入了没有数据的判断，则返回空数组
            if(deep == 1){
                return rowspan;
            }
            for(var i in property){
                var obj = {value:"",rowspan:1,property:property[i]};
                faList.push(obj);
            }
            //如果当前层级仍然小于给出的最大层级，则只是没有数据，则继续执行递归，用于数据的填充
            if(deep < structure.children.length){
                recurList(null,deep,faList);
            }
        }
        return rowspan;
    };

    //开始递归
    recurList(sourceList,0,null);

    return resultList;

};


