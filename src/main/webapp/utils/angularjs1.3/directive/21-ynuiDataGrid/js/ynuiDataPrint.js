/**
 * dataGrid打印功能实现
 * Created by YN on 2015/3/12.
 */

var ynuiDataPrintApp = angular.module("ynuiDataPrint",["LocalStorageModule"]);

ynuiDataPrintApp.config(["$httpProvider",function($httpProvider){
    // 将AngularJs的Post序列化方式和Jquery方格一致，服务器才能正常解析POST传过来的数据
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */
    var param = function(obj) {
        var query = '',
            name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name;
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    };

    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [

        function(data) {
            return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
        }
    ];

}]);

ynuiDataPrintApp.controller("ynuiDataPrintController",["$scope", "$http", "$window","localStorageService", function($scope, $http, $window,localStorageService){
    console.log("this is dataGridPrint Page!!!");
    var pageConditions = decodeURI($window.location.href).substr(decodeURI($window.location.href).indexOf("?")+1).split(/[&]/);
    $scope.printPage = function(){
        $window.document.getElementById("pageButtonArea").style.display="none";
        $window.print();
        $window.document.getElementById("pageButtonArea").style.display="";
    };
    $scope.closePage = function(){
        $window.close();
    };
    $scope.getColumns = function(str){
        console.log(str);
        var arr = str.split(/[\^]/),
            columns = new Array();
        console.log(arr);
        for(var i= 0; i<arr.length; i++){
            columns.push({field:arr[i].split(/[@]/)[0], displayName:arr[i].split(/[@]/)[1]})
        }
        return columns;
    };
    $scope.getUrl = function(){
        var url = pageConditions[4].replace("url=","");
        for(var i=5; i<pageConditions.length-1;i++){
            url += "&" + pageConditions[i];
        }
        if(pageConditions[0].replace("printAll=","") == "n"){
            return "../../../../.." + url;
        }else{
            return url;
        }
    };
    $scope.config = {
        pageTitle:pageConditions[3].replace("pageTitle=",""),
        printAll:pageConditions[0].replace("printAll=",""),
        url:$scope.getUrl(),
        columns:$scope.getColumns(pageConditions[pageConditions.length - 1].replace("columns=","")),
        pageNumber:parseInt(pageConditions[2].replace("pageNumber=","")) - 1,
        pageSize:parseInt(pageConditions[1].replace("pageSize=",""))
    };
    console.log($scope.config);
    /*
    构造数据集
     */
    $scope.getDataList = function(){
        var dataList = new Array();
        angular.forEach($scope.pageData, function(item){
            var rowArr = new Array();
            angular.forEach($scope.config.columns,function(column){
                if(item[column.field] == null){
                    rowArr.push("");
                }else{
                    rowArr.push(item[column.field]);
                }
            });
            dataList.push({cells:rowArr});
        });
        $scope.dataList = dataList;
    };
    /*
     请求数据
     */
    //获取存放在请求cookie的请求参数
    $scope.postParams = localStorageService.get("ynuiDataPrintConditions");
    //是否使用合并单元格
    $scope.rowspanStructure = localStorageService.get("ynuiDataPrintRowspanStructure");
    //根据是否使用合并单元格隐藏列
    if($scope.rowspanStructure){
        $scope.rowspanStructure.structure.rowActions = [];
        $scope.rowspanDefs = {};
        angular.forEach($scope.config.columns,function(item){
            $scope.rowspanDefs[item.field] = 'yes';
        });
        $scope.rowspanDefs["index"] = "yes";
    }
    $scope.requestData = function(str){
        var ids = str == undefined ? undefined : str.split(/[,]/);
        var requestConfig = {
            url:$scope.config.url,
            method:"POST",
            data:$scope.postParams,
            params:{pageNumber:$scope.config.pageNumber,pageSize:$scope.config.pageSize,ids:ids}
        };
        $http(requestConfig).success(function(data){
            if(data.status == 0){
//                if($scope.config.printAll == "n"){
//                    $scope.pageData = data.result;
//                }else{
//                    $scope.pageData = data.result.content;
//                }
                //不使用合并单元格
                if(data.result.content){
                    $scope.pageData = data.result.content;
                }else{
                    $scope.pageData = data.result;
                }
                if(!$scope.rowspanStructure){
                    $scope.getDataList();
                }
                else{
                //使用合并单元格
//                    $scope.rowspanProtoData = data.result.content;
                    //TODO 测试合并单元格数据，因为目前还没进行过真实数据测试，下面是生成模拟正式数据，待真实数据测试后删除下面这一句话
//                    $scope.rowspanProtoData = generDemoData();
                    $scope.initRowspanData($scope.pageData);
                }

            }
        });
    };
    //格式化rowspan的数据
    $scope.initRowspanData = function(sourceData){
        $scope.rowspanData = generRowSpanForDataGird(sourceData,$scope.rowspanStructure.structure);
    };
    /*
    获取数据
     */
    if($scope.config.printAll == "n"){
        var str = $window.name;
        $scope.requestData(str);
    }else{
        $scope.requestData();
    }
}]);




















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
    for(var i in sourceList){
        var item = sourceList[i];
        item.index = parseInt(i)+1;
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
                if(structure.rowActions && deep==1){
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
                            action:item.action
                        };
                        rowActionCol.actionList.push(action);
                    }
                    currentFaList.push(rowActionCol);
                }

                //如果有启用checkBox
                if(structure.useCheckBox && deep==1){
                    var boxObj = {selectedFlag:"no",rowspan:curChiRowSpan,index:sourceList[i].index,property:"checkBox"};
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













//TODO 测试，马上要删除了的
var generDemoData = function(){
    //结果数组
    var result = [];

    for(var i=0;i<3;i++){
        //一级
        var WinningTypeVO = {
            id:i,
            winningTypeName:"论文"+i,
            winningLevelVOList:[
                {winningLevelName:"国家级",winningRatingsVOList:[
                    {winningRatingsName:"一级",jkyWinningInformationManageVOList:[
                        {winningIdentifier:Math.ceil(Math.random()*100),winningName:"星星建筑",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:Math.ceil(Math.random()*100),winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"语文",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:2421,winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"}
                    ]},
                    {winningRatingsName:"二级",jkyWinningInformationManageVOList:[
                        {winningIdentifier:2421,winningName:"星星建筑",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:2421,winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"语文",awardCompay:"这个单位",remarks:"呵呵了"}
                    ]}
                ]},
                {winningLevelName:"省级",winningRatingsVOList:[
                    {winningRatingsName:"一级",jkyWinningInformationManageVOList:[
                        {winningIdentifier:2421,winningName:"星星建筑",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:2421,winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"语文",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:2421,winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"}
                    ]},
                    {winningRatingsName:"二级",jkyWinningInformationManageVOList:[
                        {winningIdentifier:2421,winningName:"星星建筑",winningTimeString:"2015-01-02",subjectAreaName:"数字",awardCompay:"这个单位",remarks:"呵呵了"},
                        {winningIdentifier:2421,winningName:"星星建筑1212",winningTimeString:"2015-01-02",subjectAreaName:"语文",awardCompay:"这个单位",remarks:"呵呵了"}
                    ]}
                ]}
            ]
        };
        result.push(WinningTypeVO);

    }
    return result;
};