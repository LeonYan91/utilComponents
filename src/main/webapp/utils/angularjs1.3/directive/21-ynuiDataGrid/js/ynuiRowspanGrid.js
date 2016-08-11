/**
 * Created by yanliang on 2015/7/24.
 * rowspan合并单元格组件
 */


angular.module("yn.utils").directive('ynuiRowspanGrid', [function() {
    return {
        restrict : 'AE',
        templateUrl : basePath + '/static/yineng/components/21-ynuiDataGrid/template/ynuiRowspanGrid.html',
        scope : {
            options : '='
        },
        transclude:true,
//        replace : true,
        controller:function($scope, $element){
        },
        link : function($scope, $element, $attrs, ctrls) {


            var defaultOptions = {
                useIndex:true,//默认是打开“序号”这一列的
                initData:true//默认开启加载数据
            }
            //合并默认选项
            $scope.options = angular.extend(defaultOptions,$scope.options);

            //如果有启用“序号”显示
            if($scope.options.useIndex){
                $scope.options.structure.property[0].splice(0,0,"index");
            }

            //监听源数据的改变
            $scope.$watch(function(){
                return $scope.options.data;
            },function(nv){
                if($scope.options.initData){
                    $scope.rowSpanResultList = generateRowSpanGridData(nv,$scope.options.structure);
                }
            },true);

        }
    }
}]);






/***********************  0.4 rowSpan组件  修复了点缺陷，增加可配置的最下方统计数据功能  *******************************/

/**
 *
 * @param sourceList
 * @param structure
 * @returns {Array}
 */
var generateRowSpanGridData = function(sourceList,structure){

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
//                                structure.rowActions[parseInt(r)].action(sourceList[index]);
//                            }
                            action:item.action
                        };
                        rowActionCol.actionList.push(action);
                    }
                    currentFaList.push(rowActionCol);
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










