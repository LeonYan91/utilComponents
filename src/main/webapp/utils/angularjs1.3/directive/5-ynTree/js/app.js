angular.module("ynTreeApp",["yn.utils"]).controller("ynTreeController",["$scope",function($scope){


    $scope.asyncSuccess = function(event,treeId,treeNode,msg){
        if($scope.treeConfig.ynTree.getYnTree().getNodes().length == 0){

        }
    };

    $scope.click =function(event,treeId,treeNode){

    };

    //组装系统获取系统菜单
    $scope.treeConfig = {
        useMode:"hover",//hover contextmenu
        contextMenuRule:{
            //conditionKey:"assembleType",
            conditionList:[
                {
                    domId:"dSys",
                    //conditionValue:"1",
                    rightMenuList:[
                        {id:"chooseModuleMenu01",name:"选择模块菜单",handler:function(){console.log($scope.treeConfig.ynTree.getYnTree())}},
                        {id:"addRootMenuForSys",name:"添加一级菜单",handler:function(){console.log("添加一级菜单")}},
                        {id:"releaseSys",name:"发布系统",handler:function(){console.log("发布系统")}}
                    ]
                }
            ]
        },
        setting: {
            async: {
                enable: true,
                //url: "/ynedut/menuAssemble/searchSysMenuByPlatform.htm"
                url: "/ynedut/menu/getIdUrlMappingList.htm"
            },
            data: {
                key:{
                    name:"menuUrl"
                },
                simpleData: {
                    enable: true,
                    idKey:"id",
                    pIdKey:"parentId"

                }
            },
            view:{
                addHoverDom:function(treeId, treeNode) {
                    var aObj = $("#" + treeNode.tId + "_a");
                    if ($("#diyA_add_"+treeNode.id).length>0) return;
                    if ($("#diyA_update_"+treeNode.id).length>0) return;
                    if ($("#diyA_use_"+treeNode.id).length>0) return;
                    var editStr = "<span id='diyA_add_"+treeNode.id+"'>" +
                        "<a href='javascript:void(0)' class='right_link'>增加</a>" +
                        "</span>";
                    aObj.append(editStr);
                    var addHref = $("#diyA_add_"+treeNode.id);
                    if (addHref) addHref.bind("click",$scope.addTreeNode);

                    editStr = "<span id='diyA_update_"+treeNode.id+"'>" +
                    "<a href='javascript:void(0)' class='right_link'>更新</a>" +
                    "</span>";
                    aObj.append(editStr);
                    editStr = "<span id='diyA_use_"+treeNode.id+"'>" +
                    "<a href='javascript:void(0)' class='right_link'>启用</a>" +
                    "</span>";
                    aObj.append(editStr);
                },
                removeHoverDom:function(treeId, treeNode) {
                    $("#diyA_add_"+treeNode.id).unbind().remove();
                    $("#diyA_update_"+treeNode.id).unbind().remove();
                    $("#diyA_use_"+treeNode.id).unbind().remove();
                }
            },
            callback:{
                onClick:$scope.click,
                onAsyncSuccess:$scope.asyncSuccess
            },
            check:{
                enable:false
            }
        }
    };

    $scope.$watch("selectNode",function(newVal,oldVal,opts){

    });

    $scope.addTreeNode = function(){
        if(!$scope.selectNode){
            $scope.selectNode = null;
        }
        if($scope.treeConfig.ynTree){
            $scope.treeConfig.ynTree.getYnTree().addNodes($scope.selectNode,{ id: 100, menuUrl: "叶子节点100", sex:"1000"},false);
        };
    }

    $scope.refresh = function(){
        $scope.treeConfig.ynTree.fetchFrom("/ynedut/menu/getIdUrlMappingList.htm");
    };

    $scope.selectWhich = function(index){

        var nodes = $scope.treeConfig.ynTree.getYnTree().getNodes();
        $scope.treeConfig.ynTree.getYnTree().selectNode(nodes[index]);
    };



}]);
