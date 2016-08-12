
/**
 * Project：yineng-corpSysLand
 * Title: consumptionRecordRechargeController
 * Author: yanliang
 * Date: 2016.04.11
 * Description:   充值记录管理 页面控制器
 */
angular.module('corpsyslandApp').controller('projectManageController',["$scope","$http","$location","ynModal","ynNotification","deleteInfo","$state","Crypt","$filter",function ($scope,$http,$location,ynModal,ynNotification,deleteInfo,$state,Crypt,$filter) {

    var emptySelect = {name:'请选择'};
    //初始化查询对象
    $scope.conditions = {
        queryType:1,
        projectStatus:1,
        queryDateType:1
    };
    var initDict = function(){
        $scope.dict = {};
        $scope.dict.queryType = [
            {name:"项目编号",code:1},
            {name:"项目名称",code:2},
            {name:"项目经理",code:3}
        ];
        //项目类型
        $scope.dict.projectType = {name:'请选择'};
        $http.get(basePath + "/xmglFileTemplate/findXMGLProjectByCode").success(function(data){
            $scope.dict.projectType = data;
            $scope.dict.projectType.splice(0,0,emptySelect);
            if(!$scope.projectType)
                $scope.projectType = emptySelect;
            else{
                var types = $filter('filter')($scope.dict.projectType,{code:$scope.projectType.code});
                $scope.projectType = types[0] || emptySelect;
                $scope.changeProjectType($scope.projectType,true)
            }
        });
        //项目子类
        $scope.dict.subProjectType = [
            {name:'请选择'}
        ];
        //'项目状态1：未立项，2：已立项，3：进行中，4：已结项，5：已取消'
        $scope.dict.projectStatus = [
            {name:"未立项",code:1},
            {name:"已立项",code:2},
            {name:"进行中",code:3},
            {name:"已结项",code:4},
            {name:"已取消",code:5}
        ];
        $scope.conditions.projectStatusObjList = $scope.dict.projectStatus;
        //时间查询类型 1：按计划开始时间，2：按计划结束时间，3：按实际开始时间，4：按实际结束时间
        $scope.dict.queryDateType = [
            {name:"计划开始时间",code:1},
            {name:"计划结束时间",code:2},
            {name:"实际开始时间",code:3},
            {name:"实际结束时间",code:4}
        ];
        //和我相关的项目类型 1：我参与的项目，2：我管理的项目，3：我部门的项目
        $scope.dict.involvedProjectType = [
            {name:"全部"},
            {name:"我参与的项目",code:1},
            {name:"我管理的项目",code:2},
            {name:"我监理的项目",code:3}
        ];

    };
    initDict();

    //切换项目类型的时候级联项目子类
    $scope.changeProjectType = function(type){
        $scope.conditions.projectType = type ? type.code : undefined;
        if(!type.treeDTOList || type.treeDTOList.length == 0 ){
            type.treeDTOList = [emptySelect];
        }
        if(type.treeDTOList[0].id != undefined){
            type.treeDTOList.splice(0,0,emptySelect);
        }
        $scope.dict.subProjectType = type.treeDTOList;
        if(!arguments[1])
            $scope.conditions.subProjectTypeId = undefined;
    };

    /******DataGrid配置开始*********/


    //生成获取数据的地址
    $scope.getUrl = function(){
        return  "/xmglProjectManage/queryProjectByConditions?";
    };

    //生成参数对象
    $scope.getPostParams = function(){
        var conditions = angular.copy($scope.conditions);
        switch (conditions.queryType){
            case 1:
                conditions.projectNumber = conditions.queryValue;
                break;
            case 2:
                conditions.projectName = conditions.queryValue;
                break;
            case 3:
                conditions.managerStr = conditions.queryValue;
                break;
        }
        //生成list
        conditions.projectStatusList = [];
        angular.forEach($scope.conditions.projectStatusObjList,function(item){
            conditions.projectStatusList.push(item.code);
        });
        return conditions;
    };

    //更多查询选项
    $scope.advanceOption = "更多";
    //是否显示更多查询选项
    $scope.toggleAdvanceOption = function(){
        $scope.advanceOption = $scope.advanceOption == "更多" ? "收起" : "更多";
    };

    //数据表格
    $scope.columnDefs = [
        {field:"projectNumber", displayName:"项目编号"},
        {field:"projectName", displayName:"项目名称",
            template:"<a ng-click=\"col.goCallback(row.item)\">{{row.item.projectName}}</a>",
            goCallback:function(item){
            $location.path("site/xmgl/projectManage/projectTaskManage").search({id: Crypt.encrypt(item.id),projectName:item.projectName, needAudit:item.needAudit?1:0,typeCode:item.projectType});
        }},
        {field:"projectTypeStr", displayName:"项目类型"},
        {field:"subProjectTypeStr", displayName:"项目子类"},
        {field:"managerStr", displayName:"项目经理"},
        {field:"planStartDate", displayName:"计划开始时间"},
        {field:"planEndDate", displayName:"计划结束时间"},
        {field:"actualStartDate", displayName:"实际开始时间"},
        {field:"actualEndDate", displayName:"实际结束时间"},
        {field:"projectStatusStr", displayName:"项目状态"},
        {field:"projectProgressStr", displayName:"项目进度"}
    ];


    //底部事件
    $scope.bottomActions = [
        {
            name:function(selectedItems){
                return "删除";
            },
            auth:"3",
            action:function(selectedItems){
                if(selectedItems == "" || !selectedItems || selectedItems.length == 0){
                    ynNotification.notify("error","请至少勾选一项!");
                    return;
                }
                $scope.deleteRecord(selectedItems);
            }
        }
    ];

    //定义每一行的操作事件
    $scope.rowActions = [
        {
            name:function(item){
                return "查看";
            },
            auth:"4",
            action:function(item){
                $location.path("site/xmgl/projectManage/projectManageEdit").search({handle: 'view', id: Crypt.encrypt(item.id)});
            }
        },
        {
            name:function(item){
                return "编辑";
            },
            auth:"2",
            action:function(item){
                $location.path("site/xmgl/projectManage/projectManageEdit").search({handle: 'update', id: Crypt.encrypt(item.id)});
            }
        },
        {
            name:function(item){
                return "删除";
            },
            auth:"3",
            action:function(item){
                $scope.deleteRecord(item.id);
            }
        }
    ];

    //导出所选
    $scope.exportSelected =function(ids,fields){
        if(!ids||ids.length == 0){
            ynNotification.notify("error","请至少勾选一项！");
            return false;
        }
//        if(!fields||fields.length == 0){
//            ynNotification.notify("error","你没有选中任何数据列，不能导出");
//            return false;
//        }
        var fieldsObj = new Array();
        //这里需求要求导出所有的类
        fields = $scope.columnDefs;
        for(var i in fields){
            fieldsObj.push({"key":fields[i].field,"value":fields[i].displayName});
        }
        var idsObjArray = new Array();
        for(var j in ids){
            idsObjArray.push({"name":"ids","value":ids[j]});
        }
        var columns = encodeURI(encodeURI(angular.toJson(fieldsObj)));
        window.open(basePath + "/xmglProjectManage/exportSelected?"+$.param(idsObjArray)+"&columns="+columns);
    };

    //导出全部
    $scope.exportAll =function(fields){
        var fieldsObj = new Array();
        //这里需求要求导出所有的类
        fields = $scope.columnDefs;
        for(var i in fields){
            fieldsObj.push({"key":fields[i].field,"value":fields[i].displayName});
        }
        var columns = encodeURI(encodeURI(angular.toJson(fieldsObj)));
        window.open(basePath + "/xmglProjectManage/exportAll?"+encodeURI($.param($scope.getPostParams()))+"&columns="+columns);
    };

    $scope.topActions = [
        {
            name: function (item) {
                return "添加项目";
            },
            auth:"1",
            action: function (item) {
                //$location.path("/site/xzgl/consumptionRecordRecharge/consumptionRecordRechargeEdit").search({operType:1,id:item.id});
                //$state.go('consumptionRecordRechargeEdit');
                $scope.addProject();
            },
            type:"add"
        }
    ];

    //初始化表格数据
    $scope.gridOptions = {
        //获得数据集的URL
        listUrl:$scope.getUrl(),
        //post请求参数
        postParams:$scope.getPostParams(),
        //对展示的列及列名的定义
        columnDefs:$scope.columnDefs,
        //每一页上的数据数量
        pageSize:20,
        //行操作
        rowActions:$scope.rowActions,
        topActions:$scope.topActions,
        bottomActions:$scope.bottomActions,
        //使用导出
        useExport:true,
        //导出所选
        exportSelected:$scope.exportSelected,
        //导出全部
        exportAll:$scope.exportAll,
        //默认排序字段
        sortField:"",
        disableExportAuth:true,
        cacheConditionKey:['conditions','projectType'],
        initCondition:function(condition){

        }
    };

    /**
     * 删除
     * @param id
     */
    $scope.deleteRecord = function(id){
        ynNotification.confirm("warning", "确定要删除所选吗？", "删除后无法恢复。", function () {

            $http.post(basePath +"/xmglProjectManage/deleteProject",null,{params:{id:id}}).success(function (data) {
                if(data.status == 0){
                    ynNotification.notify('success','删除成功！');
                    $scope.refreshGrid();
                }else{
                    ynNotification.notify('error','删除失败！');
                }
            });

        });

    };

    //查询开始
    $scope.search = function(){
        $scope.refreshGrid();
    };

    //刷新表格
    $scope.refreshGrid = function() {
        $scope.gridOptions.refreshGrid($scope.getUrl(), $scope.getPostParams());
        /******DataGrid配置结束*********/
    }

    $scope.ynSelectAction = {};
    //查询指令配置
    $scope.searchOptions = {
        clear: function(){
            //初始化查询对象
            $scope.conditions = {
                queryType:1,
                projectStatus:1,
                queryDateType:1
            };
            $scope.projectType = $scope.dict.projectType[0];
            $scope.ynSelectAction.clearSelectData();
        },
        search: $scope.search
    };
    $scope.addProject = function(){
        $location.path("site/xmgl/projectManage/projectManageEdit").search({handle: 'add'});
    }

}]);
