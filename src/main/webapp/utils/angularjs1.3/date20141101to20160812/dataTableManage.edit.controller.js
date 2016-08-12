/**
 * project:     yineng-corpSysLand
 * author:      yanliang
 * date:        2016/5/03 16:17
 * copyright:   2016 www.yineng.com.cn Inc. All rights reserved.
 * description: 协同数据表管理 -- 数据表定义管理
 */
angular.module("corpsyslandApp").controller("dataTableManageEditController", ["$scope", "$http", "$location","ynNotification","ynModal","$state","Crypt", function ($scope, $http, $location,ynNotification,ynModal,$state,Crypt) {

    var urlParams = $scope.urlParams = $location.search() || {};

    var initDict = function(){
        $scope.dict = {};
        $scope.dict.nameFormat = [
            {dictCode:0,dictName:'姓名 例：张三'},
            {dictCode:1,dictName:'姓名（工号） 例：张三（123456）'}
        ];
        $scope.dict.dateFormat = [
            {dictCode:0,dictName:'年-月-日 例：2016-03-29'},
            {dictCode:1,dictName:'年-月-日 时:分:秒 例：2016-03-29 16:12:14'}
        ];
        $scope.categoryPromise = $http.post(basePath + '/qjglCollaborativeCategory/findQJGLCollaborativeCategoryByConditions',{enabled:1}).success(function(data){
            if(data.status == 0){
                $scope.dict.category = data.result.content;
                $scope.dict.category.splice(0,0,{name:'请选择'})
            }
        });
    };
    initDict();

    //计算序号
    $scope.generSelectedIndex = function(){
        var count = 1;
        angular.forEach($scope.allFields,function(item){
            delete item.selectedIndex;
            if(item.checked)
                item.selectedIndex = count++;
        })
    };

    //SEQ_NUM((byte) 0, "流水号"),
    //MEMO((byte) 1, "备注文本型"),
    //ATTACHMENT((byte) 2, "附件型"),
    //STATUS((byte) 3, "状态型"),
    //CREATOR((byte) 4, "登记人"),
    //CREATE_TIME((byte) 5, "登记时间"),
    //UPDATOR((byte) 6, "最后修改人"),
    //UPDATE_TIME((byte) 7, "最后修改时间");
    //primaryFields基础数据字段
    var primaryFields = [
        {index:0,typeStr:'流水号',name:'流水号',typeCode:0,rule:{required:true,description:'根据年月日自动生成,例:160421-0001'}},
        {index:1,typeStr:'备注文本型',name:'备注文本型',typeCode:1,rule:{required:false,length:500},descGenerator:function(rule){
            return '多行文本框，长度上限为'+ rule.length +'个汉字长';
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/memoTemplate.html'},
        {index:2,typeStr:'附件型',name:'附件型',typeCode:2,rule:{required:false,multi:false},descGenerator:function(rule){
            return (rule.multi ? '多':'单')+'个上传';
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/attachmentTemplate.html'},
        {index:3,typeStr:'状态型',name:'状态型',typeCode:3,rule:{required:false,multi:false,permanentModification:false},getRule:function(rule){
            var nRule = angular.copy(rule);
            //如果content没有选项，则默认给两个2空的选项
            var contentStrArr = rule.content ? rule.content.split('/') : ["",""];
            nRule.contentArr = [];
            angular.forEach(contentStrArr,function(item){
                nRule.contentArr.push({val:item});
            });
            //nRule.contentArr = rule.content.split('/');
            return nRule;
        },setRule:function(rule){
            var contentArr = [];
            angular.forEach(rule.contentArr,function(c){
                if(c.val && c.val.trim())
                    contentArr.push(c.val);
            });
            rule.content = contentArr.join("/");
            delete rule.contentArr;
            return rule;
        },descGenerator:function(rule){
            return (rule.multi ? '多' : '单')+'选'+' 选项:'+(rule.content ? rule.content : '无选项')+' '+(rule.permanentModification ? '可':'不可')+'永久修改';
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/statusTemplate.html'},
        {index:4,checked:!urlParams.id ? true : false,typeStr:'登记人',name:'登记人',typeCode:4,rule:{required:true,nameFormat:1},descGenerator:function(rule){
            return '格式 '+$scope.dict.nameFormat[rule.nameFormat].dictName;
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/creatorTemplate.html'},
        {index:5,checked:!urlParams.id ? true : false,typeStr:'登记时间',name:'登记时间',typeCode:5,rule:{required:true,dateFormat:1},descGenerator:function(rule){
            return '格式 '+$scope.dict.dateFormat[rule.dateFormat].dictName;
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/createTimeTemplate.html'},
        {index:6,checked:!urlParams.id ? true : false,typeStr:'最后修改人',name:'最后修改人',typeCode:6,rule:{required:true,nameFormat:1},descGenerator:function(rule){
            return '格式 '+$scope.dict.nameFormat[rule.nameFormat].dictName;
            //最后修改人，和登记人使用相同的tpl
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/creatorTemplate.html'},
        {index:7,checked:!urlParams.id ? true : false,typeStr:'最后修改时间',name:'最后修改时间',typeCode:7,rule:{required:true,dateFormat:1},descGenerator:function(rule){
            return '格式 '+$scope.dict.dateFormat[rule.dateFormat].dictName;
            //最后修改时间，和登记时间使用相同的tpl
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/createTimeTemplate.html'}
    ];

    //SHORT((byte) 0, "短字符型"),
    //LONG((byte) 1, "长字符型"),
    //NUMBER((byte) 2, "数字型"),
    //CATEGORY((byte) 3, "分类型"),
    //DATE((byte) 4, "日期型");
    var extendFields = [
        {typeStr:'短字符型',name:'短字符型',typeCode:0,rule:{required:false,length:8,description:'长度上限为8个汉字长'},
            modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/requiredOnlyTemplate.html'},
        {typeStr:'长字符型',name:'长字符型',typeCode:1,rule:{required:false,length:30,description:'长度上限为30个汉字长'},
            modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/requiredOnlyTemplate.html'},
        {typeStr:'数字型',name:'数字型',typeCode:2,rule:{required:false,integer:9,decimal:0},descGenerator:function(rule){
            return '整数'+rule.integer+'位长度,保留'+rule.decimal+'位小数'
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/integerTemplate.html'},
        {typeStr:'分类型',name:'分类型',typeCode:3,rule:{required:false,multi:false},getRule:function(rule){
            var nRule = angular.copy(rule);
            //如果content没有选项，则默认给两个2空的选项
            var contentStrArr = rule.content ? rule.content.split('/') : ["",""];
            nRule.contentArr = [];
            angular.forEach(contentStrArr,function(item){
                nRule.contentArr.push({val:item});
            });
            //nRule.contentArr = rule.content.split('/');
            return nRule;
        },setRule:function(rule){
            var contentArr = [];
            angular.forEach(rule.contentArr,function(c){
                if(c.val && c.val.trim())
                    contentArr.push(c.val);
            });
            rule.content = contentArr.join("/");
            delete rule.contentArr;
            return rule;
        },descGenerator:function(rule){
            return (rule.multi ? '多' : '单')+'选'+' 选项:'+(rule.content ? rule.content : '无选项');
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/categoryTemplate.html'},
        {typeStr:'日期型',name:'日期型',typeCode:4,rule:{required:false,dateFormat:0},descGenerator:function(rule){
            return '格式 '+$scope.dict.dateFormat[rule.dateFormat].dictName;
            //日期型，和登记时间使用相同的tpl
        },modalTpl:'/scripts/app/entities/qjgl/synergyDataTable/dataTableManage/template/createTimeTemplate.html'}
    ];

    //生成初始description描述信息
    //以及初始化externalFields信息
    var initFields = function(){
        var changedExternalFields = [];
        for(var i=0;i<20;i++){
            var field = angular.copy(extendFields[i%5]);
            field.index = i;
            //(201605114 add by yanliang)generate default column name which is codeStr+index to maintain name unique
            //only name of externalFields need add index
            field.name = field.name + field.index;
            changedExternalFields.push(field);
        }
        extendFields = changedExternalFields;
        //数组extend是按下标覆盖，所以使用for循环合并值
        angular.forEach(primaryFields,function(item){
            changedExternalFields.push(item);
        });
        $scope.allFields = changedExternalFields;
        //初始化description
        angular.forEach($scope.allFields,function(item){
            if(item.descGenerator)
                item.rule.description = item.descGenerator(item.rule);
        });
    };

    var initData = function(){
        if(urlParams.id){
            //修改
            $http.post(basePath + '/collaborativeForm/findFormById',null,{params:{id:Crypt.desEncrypt(urlParams.id)}}).success(function(data){
                if(data.status != 0){
                    ynNotification.notify('error',data.message);
                    return;
                }
                $scope.tableObj = data.result;

                initFields();
                //初始化primaryFields
                angular.forEach($scope.tableObj.primaryFields,function(item){
                    var initField = primaryFields[item.index];
                    initField.id = item.id;
                    initField.rule = item.rule;
                    initField.name = item.name;
                    initField.checked = true;
                });
                //初始化extendFields
                angular.forEach($scope.tableObj.extendFields,function(item){
                    var initField = extendFields[item.index];
                    initField.id = item.id;
                    initField.rule = item.rule;
                    initField.name = item.name;
                    initField.checked = true;
                });
                //设置selectedIndex 显示序号
                $scope.generSelectedIndex();

                //自动勾选组织机构
                if($scope.tableObj.organizations && $scope.tableObj.organizations.length > 0){
                    window.setTimeout(function(){
                        $scope.$broadcast('InitModel',{model:$scope.tableObj.organizations});
                        $scope.$apply();
                    },500)
                }

                //初始化数据表类型的选中
                $scope.categoryPromise.then(function(){
                    for(var i in $scope.dict.category){
                        if($scope.dict.category[i].id == $scope.tableObj.category.id){
                            $scope.tableObj.category = $scope.dict.category[i];
                            break;
                        }
                    }
                });
            });
        }else{
            //TODO 添加，默认primaryField最后四个选中?
            $scope.tableObj = {};
            $scope.categoryPromise.then(function(){
                $scope.tableObj.category = $scope.dict.category[0];
            });
            initFields();
            //(20160514 add by yanliang)because the last four has been initially checked in add operation ,need generate selectedIndex
            $scope.generSelectedIndex()
        }

    };
    initData();

    //编辑列，弹出modal框进行编辑
    $scope.editRule = function(field){
        if(!field.checked || !field.modalTpl)
            return;
        $scope.ruleEditObj = field.getRule ?
            field.getRule(field.rule) :
            angular.copy(field.rule);
        $scope.fieldObj = field;

        //将列名存在对象上，便于编辑
        $scope.ruleEditObj.name = field.name;

        //多选时的按钮
        var button = [
            {
                value: '确定',
                callback: function () {
                    if($scope.editRuleForm.$invalid)
                        return false;
                    //valid name unique
                    for(var i in $scope.allFields){
                        if($scope.allFields[i].checked && $scope.allFields[i].name == $scope.ruleEditObj.name && $scope.fieldObj.index != $scope.allFields[i].index){
                            ynNotification.notify('error','列名['+$scope.ruleEditObj.name+']已被使用！');
                            return false;
                        };
                    }

                    field.rule = field.setRule ?
                        field.setRule($scope.ruleEditObj) :
                        angular.copy($scope.ruleEditObj);
                    field.name = $scope.ruleEditObj.name;
                    //重载description
                    if(field.descGenerator)
                        field.rule.description = field.descGenerator(field.rule);
                    delete field.rule.name;
                    $scope.$apply();
                    return true;
                },
                autofocus: true
            },
            {
                value: '取消',
                callback: function () {
                    return true;
                }
            }
        ];

        var config = {
            id: field.typeCode,
            title: field.typeStr,
            quickClose: false,
            width: 500
        };

        config.button = button;

        //保存打开的窗口对象，以便在内部关闭
        ynModal.showModal(basePath + field.modalTpl, config, $scope);

    };

    $scope.cancel = function(){
        $state.go('dataTableManage');
    };

    /**
     * 验证是否有 codeType为下拉时，如果没有设置任何下拉值，则无法提交
     */
    var validHasOptionEmpty = function(){
        for(var i in $scope.allFields){
            if($scope.allFields[i].setRule && $scope.allFields[i].checked && !$scope.allFields[i].rule.content){
                ynNotification.notify('error','序号'+$scope.allFields[i].selectedIndex+'请至少设置一个选项！');
                return true;
            }
        }
        return false;
    };

    //提交
    $scope.submit = function(type){
        if($scope.tableObjForm.$invalid)
            return;
        if(validHasOptionEmpty()){
            return;
        }
        //放入externalFields
        $scope.tableObj.extendFields = [];
        for(var i=0;i<20;i++){
            var field = $scope.allFields[i];
            if(field.checked)
                $scope.tableObj.extendFields.push(field);
        }
        $scope.tableObj.primaryFields = [];
        for(var i=20;i<$scope.allFields.length;i++){
            var field = $scope.allFields[i];
            if(field.checked)
                $scope.tableObj.primaryFields.push(field);
        }
        //请求保存数据
        $http.post(basePath + '/collaborativeForm/addOrUpdateQJGLCollaborativeForm',$scope.tableObj).success(function(data){
            if(data.status == 0){
                ynNotification.notify('success','操作成功！') ;
                if(type == 'set') {
                    $location.path("/site/qjgl/dataTableManage/setting").search({id: data.result});
                }else{
                    $state.go('dataTableManage');
                }
                //将id赋值到对象上，这样第一次添加操作后，再点击保存，才能是修改操作，不然每次都会添加一条新的数据
                $scope.tableObj.id = data.result;
            }else {
                ynNotification.notify("error",data.message);
            }
        });
    };


    //(20160514 add by yanliang)ynuiTreeSelectConfig directive config , check parent do not influence child node ,and check child do not influence parent
    $scope.ynuiTreeSelectConfig = {
        treeConfig:{
            setting:{
                check:{
                    chkboxType : {"Y": "", "N": ""}
                }
            }
        }
    };

}]);
