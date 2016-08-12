/**
 * Created by yanliang on 2015/12/31.
 * 多功能工具（瑞士军刀）服务
 * 在此服务可以添加一些小的方法，而又懒得提成一个服务的，就直接在此服务里面加方法
 */

angular.module('yn.utils').service('ynuiSwissknife', ["ynModal", "ynNotification", "$rootScope", "$http","ynPermissions", function (ynModal, ynNotification, $rootScope, $http,ynPermissions) {

    //杨元、张鹏 组在这里面添加方法
    var config = {
        /////////////在使用树组件，需要在悬浮等效果时，在后面加dom时就调用此方法来生成 CREATED BY YanLiang ON 2015.12.31 /////////////
        getHoverDom:function(type,text,obj,$scope,callback){
            var iClass = "";
            switch (type) {
                case 'add':
                    iClass = 'fa-plus';
                    break;
                case 'remove':
                    iClass = 'fa-trash-o';
                    break;
                case 'edit':
                    iClass = 'fa-pencil-square-o';
                    break;
            }


            var nodeId = "child_"+Date.parse(new Date());
            var editStr = "<span id='"+nodeId+"'>" +
                "<a href='javascript:void(0)'  class='right_link' style='color: #6ABC7A;'><i class='fa "+iClass+" margin-right-5'></i>"+text+"</a>" +
                "</span>";

            obj.append(editStr);
            var addHref = $("#"+nodeId);
            if (addHref) addHref.bind("click",callback);

            return nodeId;
        },

        /////////////在使用树组件，需要在悬浮等效果时，在后面加dom时就调用此方法，来批量生产 和 removeHoverDom结合使用  CREATED BY YanLiang ON 2016.01.04 /////////////
        addHoverDom:function(treeNode,doms){

            //选中的树属性
            var aObj = $("#" + treeNode.tId + "_a");

            //自动生成Id的自增长
            //TODO 现在先不做出服务帮助生成Id，使用者必须传入节点Id
            var idIndex = 0;
            //将id放在数组中放在数组中返回回去
            var domIds = [];
            //已经生成过Dom则返回
            for(var i in doms){
                if(!doms[i].id){
                    doms[i].id = treeNode.tId + '_child_' + idIndex;
                }
                if ($("#"+doms[i].id).length>0) return;
            }

            //开始生成Dom
            for(var i in doms){
                if(!doms[i].id){
                    doms[i].id = treeNode.tId + '_child_' + idIndex;
                }
                domIds.push(doms[i].id);

                //根据类型的不同，显示不同的图标，和样式
                var iClass = "";
                var iStyle = "";
                switch (doms[i].type) {
                    case 'add':
                        iClass = 'fa-plus';
                        iStyle = 'color: #6ABC7A';
                        break;
                    case 'remove':
                        iClass = 'fa-trash-o';
                        iStyle = 'color: #3C3A3A';
                        break;
                    case 'edit':
                        iClass = 'fa-pencil-square-o';
                        iStyle = 'color: #F0A957';
                        break;
                }

                //生成dom
                var editStr = "<span id='"+doms[i].id+"'>" +
                    "<a href='javascript:void(0)'  class='right_link' style='"+iStyle +";'><i class='fa "+iClass+" margin-right-5'></i>"+doms[i].name+"</a>" +
                    "</span>";
                aObj.append(editStr);

                var addHref = $("#"+doms[i].id);
                if (addHref) addHref.bind("click",doms[i].callback);

            }

            return domIds;
        },

        /////////////在使用树组件，消除使用generHoverDom生成的悬浮Dom时使用  CREATED BY YanLiang ON 2016.01.04 /////////////
        removeHoverDom:function(domIds){
            for(var i in domIds){
                $("#"+domIds[i]).unbind().remove();
            }
        },

        /////////////选中树节点  CREATED BY YanLiang ON 2016.01.07 /////////////
        checkTreeNodes:function(selected,tree,key,childKey){
            if(!childKey)
                childKey = 'children';
            //先反选所有节点
            //(20160525 remove by yanliang)when node had been removed some using #removeNode# ，this method do not work,so to uncheck node during the recursion
            //tree.checkAllNodes(false);

            //递归选中节点
            var recurSelected = function(node,id,tree,selectedArr,key){

                //(20160525 add by yanliang)add the unchecking of node to recursion
                tree.checkNode(node,false,false);

                //node[key] == id
                if(selected.some(function(item){return node[key] == item[key];})){
                    tree.checkNode(node,true,false);
                    selectedArr.push(node);
                }
                angular.forEach(node[childKey],function(no){
                    recurSelected(no,id,tree,selectedArr,key);
                });

            };

            var nodes = tree.getNodes();

            var selectedArr = [];
            //angular.forEach(selected,function(item){
                angular.forEach(nodes,function(no){
                    recurSelected(no,undefined,tree,selectedArr,key);
                });
            //});
            return selectedArr;

        },

        /////////////KHGL 大客户管理，4个流程相关操作的同一提示方法（因为一样，使用同一接口）  CREATED BY YanLiang ON 2016.01.07 /////////////
        khglActivitiHint:function(data,callback,$scope){
            var backFun = function(){
                callback();
                if($scope){
                    $scope.$apply();
                }
            };
            if(data.status==0){
                ynNotification.notify("success","操作成功!");
                callback();
            }else if(data.status == 1){
                ynNotification.alert("warning", '下一个节点中没有设置人员，请前往流程定义设置！', "已经驳回，确认返回？", backFun,null,backFun,null);
            }else{
                ynNotification.notify("success","操作失败!");
            }

        },

        ///////////  通过key取得码表 /////////////////////////////
        getDictList:function(key,callback,addEmpty){
            return $http.post(basePath +"/xmglProjectManage/queryDictListByKey",null,{params:{key:key}}).success(function (data) {
                if(data.status == 0){
                    if(addEmpty){
                        data.result.splice(0,0,{dictName:"请选择"});
                    }
                    callback(data.result);
                }
            });
        },

        ///////////////  根据权限过滤树  /////////////////
        filterTreeAuth:function(tree,key,childKey,actionTypeMap){
            key = key || 'id';
            childKey = childKey || 'platformSysOrganizationDTOList';
            actionTypeMap = actionTypeMap || {};

            var resource = ynPermissions.getAuthRegion(4);//获取当前页面某功能点的管理域,4代表获取查询权限
            var regionType = resource[0] ? resource[0].regionType : 0;//管理域对应状态
            var orgIds = resource[0] ? resource[0].orgList : [];//管理域对应组织机构ID
            //$scope.conditions.regionType = regionType;//管理域对应状态
            //$scope.conditions.orgIds = orgIds;//管理域对应组织机构ID

            //all auth
            var allAuth = regionType.indexOf("1")!=-1;


            var allNodes = [];
            var recurTree = function(nodes){
                var childHasAuth = false;

                angular.forEach(nodes,function(node){
                    allNodes.push(node);
                    var nodeHasAuth = orgIds.some(function(item){
                        return item == node[key] && (!actionTypeMap.filterFun || actionTypeMap.filterFun(node));
                    });
                    node.hasAuth = nodeHasAuth || allAuth;

                    if(node[childKey] && node[childKey].length > 0){
                        node.childHasAuth = recurTree(node[childKey]);
                    }
                    if(!childHasAuth && (node.hasAuth || node.childHasAuth))
                        childHasAuth = true;
                });

                var nodes = tree.getNodes();
                return childHasAuth || allAuth;
            };

            var nodes = tree.getNodes();
            recurTree(nodes);

            var disabled = !actionTypeMap || actionTypeMap.checkDisable;
            //开始根据hasAuth 以及 childHasAuth 对树进行过滤
            angular.forEach(allNodes,function(node){
                if(actionTypeMap && actionTypeMap.ignoreNode && actionTypeMap.ignoreNode(node))
                    return;

                if(!node.hasAuth && !node.childHasAuth)
                    //都没权限，删除节点
                    tree.removeNode(node);
                else if(!node.hasAuth && node.childHasAuth){
                    tree.setChkDisabled(node,disabled)
                }
            });

        }

    };


    //郭宏锦 组在这里面添加方法
    var secondConfig = {};

    //合并所有配置
    angular.extend(config, secondConfig);

    return config;
}]);

