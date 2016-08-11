ynUtilsApp.directive("ynTreeBak",["$http","$compile",function($http,$compile) {
    return {
        priority : 5000,
        require: '?ngModel',
        restrict: 'AE',
        scope: {
            ngModel : "=",
            treeConfig: "="
        },
        link: function ($scope, $element, $attrs,ngModelController) {
            if($scope.treeConfig == undefined){
                return;
            }
            if($scope.treeConfig.id == undefined){
                $scope.treeConfig.id = $attrs.id;
            }
            var conditionKey = null;

            function init(){
                if($scope.treeConfig.contextMenuRule && $scope.treeConfig.contextMenuRule.conditionKey){
                    conditionKey = $scope.treeConfig.contextMenuRule.conditionKey;
                }

                angular.forEach($scope.treeConfig.contextMenuRule.conditionList,function(condition){
                    initContextMenu(condition);
                });
            }

            function initContextMenu(condition){
                var contextMenuId = condition.domId;
                var menuText = "<div id='"+contextMenuId+"' class='ztree_right_menu'><ul>";
                angular.forEach(condition.rightMenuList,function(rightMenu){
                    menuText += "<li id='"+contextMenuId+"_"+rightMenu.id+"'>"+rightMenu.name+"</li>";
                });
                menuText +="</ul></div>";
                var menuDomEl = $compile(menuText)($scope);
                angular.element("body").append(menuDomEl);
                angular.forEach(condition.rightMenuList,function(rightMenu){
                    if($("#"+contextMenuId+"_"+rightMenu.id)){
                        $("#"+contextMenuId+"_"+rightMenu.id).bind("click",rightMenu.handler);
                    }
                });
            }

            //将需要的值绑定到指令指定的ngModel上
            function applyNgModel(treeNode){
                if (typeof(ngModelController) != undefined && ngModelController != null) {
                    $scope.$apply(function () {
                        $scope.treeConfig.ynTree.selectedNode = treeNode;
                        ngModelController.$setViewValue(treeNode);
                    });
                }
            }

            //mouseDown的控制
            function onBodyMouseDown(event){
                angular.forEach($scope.treeConfig.contextMenuRule.conditionList,function(condition) {
                    if (!(event.target.id == condition.domId || $(event.target).parents("#" + condition.domId).length > 0)) {
                        $("#"+condition.domId).css({"visibility": "hidden"});
                    }
                });
            }

            //控制显示右键
            function showRMenu(type, x, y,treeNode){
                if(!$scope.treeConfig.conditionKey){
                    if($scope.treeConfig.contextMenuRule.conditionList && $scope.treeConfig.contextMenuRule.conditionList.length == 1){
                        var condition = $scope.treeConfig.contextMenuRule.conditionList[0];
                        $("#"+condition.domId+" ul").show();
                        $("#"+condition.domId).css({position:"absolute","top":y+"px", "left":x+"px", "visibility":"visible"});
                        $("body").bind("mousedown", onBodyMouseDown);
                        return;
                    }
                }
                angular.forEach($scope.treeConfig.contextMenuRule.conditionList,function(condition){
                    if(treeNode[conditionKey]==condition.conditionValue){
                        $("#"+condition.domId+" ul").show();
                        $("#"+condition.domId).css({position:"absolute","top":y+"px", "left":x+"px", "visibility":"visible"});
                        $("body").bind("mousedown", onBodyMouseDown);
                        return;
                    }
                });
            }

            //右键行为
            function OnRightClick(event, treeId, treeNode) {
                applyNgModel(treeNode);
                if (!treeNode && event.target.tagName.toLowerCase() != "button" && $(event.target).parents("a").length == 0) {
                    $scope.treeConfig.ynTree.getYnTree().cancelSelectedNode();
                    //showRMenu("root", event.clientX, event.clientY);
                } else if (treeNode && !treeNode.noR) {
                    $scope.treeConfig.ynTree.getYnTree().selectNode(treeNode);
                    showRMenu("node", event.pageX, event.pageY,treeNode);
                }
            }
            //修改右键菜单 element对象{name:右键菜单名称,action:右键菜单点击触发行为}
            $scope.treeConfig.updateRmenu = function(domId,element){
                var domNode = $("#" + domId);
                domNode.html(element.name);
                if(element.action != undefined){
                    domNode.unbind();
                    domNode.bind("click",element.action);
                }
            };
            //提供一些默认的树配置
            var treeConfig = {
                setting: {
                    edit:{
                        enable:false,
                        showRemoveBtn: false,
                        showRenameBtn: false
                    },
                    view:{
                        showIcon: false
                    },
                    check: {
                        enable: true
                    }
                }
            };

            if (typeof($scope.treeConfig) == undefined) {
                $scope.treeConfig = {}
            }

            if (typeof($scope.treeConfig.setting) == undefined) {
                $scope.treeConfig.setting = {}
            }

            //整合应用传入的和默认的参数
            treeConfig.setting = angular.extend({},treeConfig.setting, $scope.treeConfig.setting);

            if(!treeConfig.setting.callback){
                treeConfig.setting.callback = {};
            }
            if(!treeConfig.setting.view.showIcon){
                treeConfig.setting.view.showIcon = false;
            }

            //隐藏右键菜单
            $scope.treeConfig.hideRmenu = function(){
                var domNodes = $scope.treeConfig.contextMenuRule.conditionList;
                angular.forEach(domNodes,function(domNode){
                    $("#"+domNode.domId).css({"visibility":"hidden"});
                    $("body").unbind("mousedown", onBodyMouseDown);
                });
            };
            treeConfig.setting.callback.onRightClick = OnRightClick;

            //使用模式 分为hover和contextmenu
            var useMode = "";
            if($scope.treeConfig.useMode){
                useMode = $scope.treeConfig.useMode.toLowerCase();
            }

            var rMenu;
            if(useMode == "hover"){
                //变更默认的addHoverDom
                var addHoverDom = treeConfig.setting.view.addHoverDom;
                treeConfig.setting.view.addHoverDom = function(treeId, treeNode){
                    applyNgModel(treeNode);
                    if(typeof addHoverDom === 'function'){
                        addHoverDom(treeId, treeNode);
                    }
                };
                treeConfig.setting.callback.onRightClick = null;
            }else if(useMode == "contextmenu"){
                init();
                rMenu = $("#"+$scope.treeConfig.contextMenuId);
                if(treeConfig.setting.view && treeConfig.setting.view.addHoverDom){
                    treeConfig.setting.view.addHoverDom = null;
                }
                if(treeConfig.setting.view && treeConfig.setting.view.removeHoverDom){
                    treeConfig.setting.view.removeHoverDom = null;
                }
            }


            window.setTimeout(function(){
                $.fn.zTree.init($element, treeConfig.setting);
            },0);

            $scope.treeConfig.ynTree = {};

            $scope.treeConfig.ynTree.getYnTree = function(){
                return $.fn.zTree.getZTreeObj($scope.treeConfig.id);
            };

            $scope.treeConfig.ynTree.fetchFrom = function(url){
                if(url){
                    treeConfig.setting.async.url = url;
                }
                $.fn.zTree.init($element, treeConfig.setting);
            }
        }
    };
}]);
