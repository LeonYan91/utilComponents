angular.module("ynuiDataGridApp",['yn.utils','ngSanitize',"LocalStorageModule"]).controller("ynuiDataGridController",["$scope","$http","ynNotification","ynModal",function($scope,$http,ynNotification,ynModal){

    //查询条件
    $scope.conditions = {
        buildId : "",
        floorNum : "",
        name : "",
        status : "",
        orgNo : "",
        purpose : "",
        type : ""
    };

    //导出所选
    $scope.exportSelected =function(ids,fields){
        if(!ids||ids.length == 0){
            ynNotification.notify("error","请至少勾选一项！");
            return false;
        }
        if(!fields||fields.length == 0){
            ynNotification.notify("error","你没有选中任何数据列，不能导出");
            return false;
        }
        var fieldsObj = new Array();
        for(var i in fields){
            fieldsObj.push({"key":fields[i].field,"value":fields[i].displayName});
        }
        var idsObjArray = new Array();
        for(var j in ids){
            idsObjArray.push({"name":"ids","value":ids[j]});
        }
        window.open(basePath + "/classroomMaintain/exportSelected.htm?"+$.param(idsObjArray)+"&columns="+angular.toJson(fieldsObj));
    };

    //导出全部
    $scope.exportAll =function(fields){
        var fieldsObj = new Array();
        for(var i in fields){
            fieldsObj.push({"key":fields[i].field,"value":fields[i].displayName});
        }
        window.open(basePath + "/classroomMaintain/exportAll.htm?"+$.param($scope.conditions)+"&columns="+angular.toJson(fieldsObj));
    };

    //顶部事件
    $scope.topActions = [
        {
            name:function(selectedItems){
                return "设置";
            },
            auth:"modify",
            action:function(selectedItems,options){
                console.log(selectedItems);
                console.log(options);
                alert('设置');
            }
        },{
            name:function(selectedItems){
                return "删除";
            },
            auth:"remove",
            action:function(selectedItems){
                alert('删除');
            },
            dropList:[
                {
                    name:function(selectedItems){

                        return "删除一个";
                    },
                    auth:"modify",
                    action:function(selectedItems){
                        console.log(selectedItems);
                        console.log($scope.gridOptions.data.content);
                        alert('删除一个');
                    }
                },
                {
                    name:function(selectedItems){
                        return "删除一群";
                    },
                    auth:"modify",
                    action:function(selectedItems,option){
                        alert('删除一群');
                        console.log(option);
                    }
                }
            ]
        },{
            name:function(){
                return "添加";
            },
            auth:"add",
            action:function(){
                alert('添加');
            }
        },{
            name:function(){
                return "批量添加";
            },
            auth:"add",
            action:function(){
                alert('批量添加');
            }
        },{
            name:function(){
                return "导入";
            },
            auth:"import",
            action:function(){
                alert('导入');
            }
        }
    ];

    //底部事件
    $scope.bottomActions = [
        {
            name:function(selectedItems){
                return "设置";
            },
            auth:"modify",
            action:function(selectedItems){
                alert('设置');
            },
            dropList:[
                {
                    name:function(selectedItems){
                        return "设置下拉了1";
                    },
                    auth:"modify",
                    action:function(selectedItems){
                        console.log(selectedItems);
                        alert('设置下拉了1');
                    }
                },
                {
                    name:function(selectedItems){
                        return "设置下拉了2";
                    },
                    auth:"modify",
                    action:function(selectedItems){
                        alert('设置下拉了2');
                    }
                }
            ]
        },{
            name:function(selectedItems){
                return "删除";
            },
            auth:"remove",
            action:function(selectedItems){
                console.log(selectedItems);
                alert('删除');
            }
        }
    ];

    //定义每一行的操作事件
    $scope.rowActions = [
        {
            name:function(item){
                return item.status == 1 ? "停用" : "启用";
            },
            auth:"enable",
            action:function(item){
                console.log(item);
            }
        },
        {
            name:function(item){
                return "修改";
//                return "<input type=\"radio\" name=\"act.modify\"/>"
            },
            auth:"modify",
            action:function(item){
                console.log("修改");
                console.log(item);
            },
            template:
                "<input ng-if=\"row.item.floorNum == '1'\" type=\"radio\" name=\"act.modify\"/>" +
                "<input ng-if=\"row.item.floorNum == '2'\" type=\"button\" value=\"{{row.item.name}}\" name=\"act.button\"/>"
        },
        {
            name:function(item){
                return "删除";
            },
            auth:"remove",
            action:function(item){
                $scope.deleteClassroom(item);
            }
        }
    ];

//    //数据表格
//    $scope.columnDefs = [
//        {field:function(item){
//            return "<input type='button' value='{{rowData.buildName}}' ng-click='clickTest()'/>";
////            return item.buildName;
//        }, displayName:"楼栋名称"},
//        {field:"floorNum", displayName:"楼层号"},
//        {field:"orgName", displayName:"组织机构"},
//        {field:"name", displayName:"教室名称"},
//        {field:"purposeName", displayName:"教室用途"},
//        {field:"typeName", displayName:"教室类型"},
//        {field:"square", displayName:"面积(平米)",columnSelectFlag:"no"},
//        {field:"capacity", displayName:"容量(人数)",columnSelectFlag:"no"},
//        {field:function(item){
//            return item.status == '1' ? "真的可以用哦" : "不能用了";
//        }, displayName:"状态"}
//    ];
    //数据表格
    $scope.columnDefs = [
        {field:"buildName", displayName:"楼栋名称",
            template:"<input value=\"{{row.item.name}}\" type=\"button\" ng-class=\"{'btn' : row.item.floorNum == '2'}\" ng-click=\"col.action(row.item)\">",
            action:function(item){
                item.floorNum = item.floorNum == '1' ? '2':'1';
            }
        },
        {field:"floorNum", displayName:"楼层号"},
        {field:"orgName", displayName:"组织机构"},
        {field:"name", displayName:"教室名称"},
        {field:"purposeName", displayName:"教室用途"},
        {field:"typeName", displayName:"教室类型"},
        {field:"square", displayName:"面积(平米)",columnSelectFlag:"no"},
        {field:"capacity", displayName:"容量(人数)",columnSelectFlag:"no"},
        {field:"statusName", displayName:"状态",fieldFun:function(item){
            return item.status == '1' ? "真的可以用哦" : "不能用了";
        }}
    ];
    //新生报名信息维护 数据表格
//    $scope.columnDefs = [
//        {field:"gradeName", displayName:"年级"},
//        {field:"enrollTypeName", displayName:"招生类型"},
//        {field:"regNumber", displayName:"报名号"},
//        {field:"name", displayName:"姓名"},
//        {field:"gender", displayName:"性别"},
//        {field:"nation", displayName:"民族"},
//        {field:"credentialTypeName", displayName:"证件类型"},
//        {field:"credentialNumber", displayName:"证件号码"},
//        {field:"mobile", displayName:"手机号"},
//        {field:"graduateSchool", displayName:"毕业学校"},
//        {field:"regWay", displayName:"报名方式"},
//        {field:"studentsResource", displayName:"生源地"},
//        {field:"admissionStatus", displayName:"录取状态"}
//    ];

    //生成获取数据的地址
    $scope.getUrl = function(){
        ynNotification.notify("info","正在加载...");
        var url = "/classroomMaintain/searchClassroom.htm?";
//        if($scope.conditions.buildId){
//            url += "&buildId="+$scope.conditions.buildId;
//        }
//        if($scope.conditions.floorNum){
//            url += "&floorNum="+$scope.conditions.floorNum;
//        }
//        if($scope.conditions.name){
//            url += "&name="+$scope.conditions.name;
//        }
//        if($scope.conditions.status){
//            url += "&status="+$scope.conditions.status;
//        }
//        if($scope.conditions.orgNo){
//            url += "&orgNo="+$scope.conditions.orgNo;
//        }
//        if($scope.conditions.purpose){
//            url += "&purpose="+$scope.conditions.purpose;
//        }
//        if($scope.conditions.type){
//            url += "&type="+$scope.conditions.type;
//        }
        return  url;
    };
//    $scope.getUrl = function(isParams){
//        ynNotification.notify("info","正在加载...");
//        var url = "/newRegInfoMaintain/searchRegInfo.htm?queryType=1"
////        if($scope.conditions.gradeId){
////            url += "&gradeId="+$scope.conditions.gradeId;
////        }
////        if($scope.conditions.enrollType){
////            url += "&enrollType="+$scope.conditions.enrollType;
////        }
////        if($scope.conditions.queryValue){
////            url += "&queryValue="+$scope.conditions.queryValue;
////        }
////        if($scope.advanceOption == "收起"){
////            if($scope.conditions.gender){
////                url += "&gender="+$scope.conditions.gender;
////            }
////            if($scope.conditions.regWay){
////                url += "&regWay="+$scope.conditions.regWay;
////            }
////            if($scope.conditions.admissionStatus){
////                url += "&admissionStatus="+$scope.conditions.admissionStatus;
////            }
////        }
//
//        return  url;
//    };


    var structureForDataGrid = {
        property:[
            ["winningTypeName"],
            ["winningLevelName"],
            ["winningRatingsName"],
            ["winningIdentifier","winningName","winningTimeString","subjectAreaName","awardCompay","remarks"]
        ],
        children:["winningLevelVOList","winningRatingsVOList","jkyWinningInformationManageVOList"],
        rowActions:[
            {
                name:function(item){
                    return "查看";
                },
                auth:"query",
                action:function(item){
                    console.log("查看");
                    console.log(item);
                }
            },
            {
                name:function(item){
                    return "修改";
                },
                auth:"query",
                action:function(item){
                    console.log("修改");
                    console.log(item);
                }
            }
        ]
//        statisticConfig:[
//            {colspan:2,name:"合计"},
//            {colSpan:1,property:"count",childDeep:1},
//            {colSpan:1,name:"查看",callback:function(){
//                console.log("呵呵了");
//            }}
//        ]
    };

    $scope.rowspanOptionsForDataGird = {
        structure:structureForDataGrid,
        data:null,
        useIndex:true,
        columnDefs:[
            {field:"winningTypeName",displayName:"获奖类别",columnSelectFlag:"yes"},
            {field:"winningLevelName",displayName:"获奖级别"},
            {field:"winningRatingsName",displayName:"获奖等级"},
            {field:"winningIdentifier",displayName:"获奖成果编号"},
            {field:"winningName",displayName:"获奖成果名称"},
            {field:"winningTimeString",displayName:"获奖日期"},
            {field:"subjectAreaName",displayName:"学术领域"},
            {field:"awardCompay",displayName:"颁奖单位",columnSelectFlag:"no"},
            {field:"remarks",displayName:"备注"}
        ]
    };


//    //默认初始配置
    $scope.gridOptions = {
        //获得数据集的URL
        listUrl:$scope.getUrl(),
        //对展示的列及列名的定义
        columnDefs:$scope.columnDefs,
//        columnDefs:$scope.rowspanOptionsForDataGird.columnDefs,
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
        //使用打印，默认关闭
        usePrint:true,
        //导出所选
        exportSelected:$scope.exportSelected,
        //导出全部
        exportAll:$scope.exportAll,
//        默认排序字段
        //sortField:"id",
        clickRow:$scope.clickRow,
//        primaryKey:'name',
//        useCheckBox:false,
//        useOperate:false,
        printConfig:{
            title:"新生报名维护信息",
            printSelectedReqUrl:"/newRegInfoMaintain/printSelected.htm"
        },
        useTransclude:false,
        useAbovePagination:true
//        rowspanConfig:$scope.rowspanOptionsForDataGird
//        useIndex:false
    };

    $scope.showOptions = function(){
        console.log($scope.gridOptions);
    };

    //删除教室
    $scope.deleteClassroom = function(item){
        ynNotification.confirm("warning","确定要删除所选吗？","删除后无法恢复。",function(){
            $http.get(basePath+"/classroomMaintain/deleteClassroom.htm",{params:{id:item.id}}).success(function(data){
                if(data.status == 0){
                    $scope.refreshGrid();
                    ynNotification.notify("success","删除成功！");
                }else{
                    ynNotificatoin.notify("error",data.message);
                }
            });
        });

    };

    $scope.refreshGrid = function(){
        $scope.gridOptions.pageNumber = 0;
        $scope.gridOptions.loadData();
    };



    //刷新rowspan 测试数据表格
    $scope.initRowspanGridData = function(){
        $scope.rowspanOptions.data = generDemoData();
    };

    /***********************  rowspanGrid 测试配置  ************************************/
    var structure = {
        property:[
            ["winningTypeName"],
            ["winningLevelName"],
            ["winningRatingsName"],
            ["winningIdentifier","winningName","winningTimeString","subjectAreaName","awardCompay","remarks"]
        ],
        children:["winningLevelVOList","winningRatingsVOList","jkyWinningInformationManageVOList"],
        rowActions:[
            {
                name:function(item){
                    return "查看";
                },
                auth:"query",
                action:function(item){
                    console.log("查看");
                    console.log(item);
                }
            },
            {
                name:function(item){
                    return "修改";
                },
                auth:"query",
                action:function(item){
                    console.log("修改");
                    console.log(item);
                }
            }
        ]
//        statisticConfig:[
//            {colspan:2,name:"合计"},
//            {colSpan:1,property:"count",childDeep:1},
//            {colSpan:1,name:"查看",callback:function(){
//                console.log("呵呵了");
//            }}
//        ]
    };

    $scope.rowspanOptions = {
        structure:structure,
        data:null,
        useIndex:true,
        columnDefs:[
            {field:"winningTypeName",displayName:"获奖类别",columnSelectFlag:"yes"},
            {field:"winningLevelName",displayName:"获奖级别"},
            {field:"winningRatingsName",displayName:"获奖等级"},
            {field:"winningIdentifier",displayName:"获奖成果编号"},
            {field:"winningName",displayName:"获奖成果名称"},
            {field:"winningTimeString",displayName:"获奖日期"},
            {field:"subjectAreaName",displayName:"学术领域"},
            {field:"awardCompay",displayName:"颁奖单位",columnSelectFlag:"no"},
            {field:"remarks",displayName:"备注"}
        ]
    };






}]);





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