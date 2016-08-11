'use strict';
/**
 * project:     yineng-corpSysLand
 * title:       app
 * author:      Zhang YongSheng
 * date:        2016/4/6 10:58
 * copyright:   2016 www.yineng.com.cn Inc. All rights reserved.
 * description:
 */

/*************************XXXX配置开始*************************/
angular.module("corpsyslandApp",[]);
angular.module("corpsyslandApp").controller("ynuiTreeTable",["$scope","ynNotification","$sce","$filter",function ($scope,ynNotification,$sce,$filter) {


    //数据表格
    $scope.columnDefs = [
        {field:"taskName", displayName:"任务名称",isExpand:true,editable:true},
        {
            field:"document", displayName:"预期成果文档",template:"<div><a ng-click='col.action(item)'>选择</a></div>",
            action:function(item){
            }
        }
    ];


    $scope.option = {
        //查询URL
        url:"/xmglProjectTemplate/findXMGLTemplateTask?templateId="+$scope.id,
        //列定义
        columnDefs:$scope.columnDefs,
        //子节点名称
        children:"childrenTaskList",
        //加载序号
        useSerialNumber:true,
        //默认展开
        defaultExpand:true,
        //编辑框失去焦点时的方法
        blurEdit:function(item){
            //保存数据URL
            return $http.post(basePath + "/xmglProjectTemplate/findXMGLProjectTemplateByConditions",{id:1},{params:{pageSize:20,pageNumber:0}}).success(function(data){
            })
        }
    };
}])
/*************************XXXX配置结束*************************/
