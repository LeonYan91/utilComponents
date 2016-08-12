/**
 * Project：yineng-corpSysLand
 * Title: evidenceRecordProcessController
 * Author: yanliang
 * Date: 2015/11/24 14:44
 * Copyright:
 * Description: 凭证管理-凭证处理  控制器
 */
angular.module('corpsyslandApp').controller('evidenceRecordProcessController',["$scope","$http","$location","$filter","ynNotification","ynModal","ynuiSelectorService","Crypt",function ($scope,$http,$location, $filter,ynNotification,ynModal,ynuiSelectorService,Crypt) {

    var urlParamsSrc = $location.search();
    for (var i in urlParamsSrc) {
        urlParamsSrc[i] = Crypt.desEncrypt(urlParamsSrc[i]);
    }

    $scope.urlParams = urlParamsSrc || {};

    /**
     * 根据凭证id查询出凭证详情
     * @param id
     * @param updated
     * @returns {*}
     */
    var getEvidence = function(id,updated){

        var evidencePromise = null;
        //根据是否是 修改过的凭证 来调用不同的接口
        if(updated){
            evidencePromise = $http.post(basePath +"/szglEvidenceRecordProcess/findEvidenceByRecordId",null,{params:{recordId:id}}).success(function (data) {
                if(data.status == 0){
                    $scope.evidence = data.result;
                    $scope.evidence.id = id;
                    //从url上获取的数据
                    var urlEvidence = urlParamsSrc;
                    $scope.evidence.evidenceNumber = urlEvidence.evidenceNumber;
                    $scope.evidence.makeDate = urlEvidence.makeDate;
                    $scope.evidence.makeRsglSysUserName = urlEvidence.makeRsglSysUserName;

                }else{
                    ynNotification('error','查询凭证失败！');
                }
            });
        }else{
            evidencePromise = $http.post(basePath +"/szglEvidenceRecordProcess/findDetailList",null,{params:{evidenceId:id}}).success(function (data) {
                if(data.status == 0){
                    $scope.evidence.evidenceDetailDTOList = data.result;
                }else{
                    ynNotification('error','查询凭证失败！');
                }
            });
        }

        return evidencePromise;
    };

    /**
     * 初始化可选的分配方式array
     * @param arr
     */
    var initApportionTypeArr = function(arr){
        angular.forEach(arr,function(item){
            //修改过来时需要开始反选
            var ruleObj = {
                1:"",
                2:"",
                3:"",
                4:"",
                5:"",
                6:"",
                7:""
            };
            if(item.apportionRule){
                var ruleArr = item.apportionRule.split(",");
                angular.forEach(ruleArr,function(r){
                    var rule = parseInt(r);
                    ruleObj[rule] = rule;
                });
            }

            item.apportionTypeArr = [];
            //实体类型:1.按组织机构 2.按个人 3.按阿米巴 4.按项目 5.按产品 6.按市场区域 7.按分销商
            item.apportionTypeArr.push({name:'按组织机构',type:1,value:ruleObj[1]});
            item.apportionTypeArr.push({name:'按个人',type:2,value:ruleObj[2]});
            item.apportionTypeArr.push({name:'按阿米巴',type:3,value:ruleObj[3]});
            item.apportionTypeArr.push({name:'按项目',type:4,value:ruleObj[4]});
            item.apportionTypeArr.push({name:'按产品',type:5,value:ruleObj[5]});
            item.apportionTypeArr.push({name:'按市场区域',type:6,value:ruleObj[6]});
            item.apportionTypeArr.push({name:'按分销商',type:7,value:ruleObj[7]});

        });
    };

    /**
     * 生成码表信息
     */
    var initDict = function(){
        //在页面写死的码表
        $scope.dict = {};
        //流水类型
        $scope.dict.accountType = [
            {name:'资金流入',code:1},
            {name:'资金流出',code:2},
            {name:'不适用',code:3}
        ];
        //收支类型（这里收入、支出的code值是和资金属性设置那边的）
        $scope.dict.feeType = [
            {name:'收入',code:2},
            {name:'支出',code:1},
            {name:'不适用',code:3}
        ];
        //分摊类型
        $scope.dict.apportionType = [
            {name:'立即分摊',code:1},
            {name:'后续分摊',code:2}
        ];
        //1.固定费用,2.变动费用
        //阿米巴 费用类型
        $scope.dict.amoebaFeeType = [
            {name:'固定费用',code:1},
            {name:'变动费用',code:2}
        ];
        //查询所有的业务系统
        //涉及业务系统码表
        $scope.dict.systemList = [];
        $http.post(basePath + "/platformcommondictionaryresource/findReferSystem").success(function (data) {
            angular.forEach(data,function(item){
                $scope.dict.systemList.push({name:item.dictName,code:item.dictCode});
            });

        })
    };

    /**
     * 初始化查询出来的凭证明细，
     * 初始化例如 流水类型，收支类型等
     */
    var initEvidenceDetails = function(arr){
        angular.forEach(arr,function(item){
//            accountType:3,feeType:3,apportionType:1
            //流水类型
            if(!item.accountType){
                item.accountType = 3;
            }
            //收支类型
            if(!item.feeType){
                item.feeType = 3;
            }
            //分摊类型
            if(!item.apportionType){
                item.apportionType = 1;
            }
        });
    };

    /**
     * 如果无法操作流水的时候展示名称
     * @param codes
     * @returns {string}
     */
    $scope.getReferSystemNames = function(codes){
        if(!codes){
            return '无';
        }
        if($scope.dict.systemList && $scope.dict.systemList.length > 0){
            var codesList = codes.split(',');
            var systemList = [];
            angular.forEach(codesList,function(code){
                angular.forEach($scope.dict.systemList,function(sys){
                    if(code == sys.code){
                        systemList.push(sys.name);
                    }
                });
            });
            return systemList.join(',');
        }

    };

    /**
     * 初始化涉及系统
     * @param data
     */
    var initReferSystem = function(data){
        if(data.referSystemCodes){
            data.referSystemCodesList = [];
            var codesList = data.referSystemCodes.split(',');
            angular.forEach(codesList,function(cod){
                data.referSystemCodesList.push({code:cod});
            });
        }
    };

    /**
     * 回填时数据的初始化
     */
    var initModiData = function(){
        var detailIndex = 0;
        //初始化明细
        angular.forEach($scope.evidence.evidenceDetailDTOList,function(detail){
            detailIndex++;
            detail.index = detailIndex;
            //初始化流水
            if(detail.fundFlowDTOList && detail.fundFlowDTOList.length>0){
                angular.forEach(detail.fundFlowDTOList,function(flow){
                    flow.index = detail.index;
                    //初始化涉及系统
                    initReferSystem(flow);
                    //(add on 20160309 by yanliang)如果有一个资金流水以及冲抵过了，则这条明细的流水都不能操作
                    if(flow.isOffset){
                        detail.isOffset = true;
                    }
                });

            }
            //初始化收支记录
            if(detail.fundRecordDTOList && detail.fundRecordDTOList.length > 0){
                angular.forEach(detail.fundRecordDTOList,function(record){
                    //初始化涉及系统
                    initReferSystem(record);
                    record.index = detailIndex;
                    record.dict = {
                        attributeType:[{
                            code:"",
                            name:"请选择"
                        }],
                        jyhsFundAttributeId:[{
                            code:"",
                            name:"请选择"
                        }]
                    };
                    //初始化收支类别下拉
                    $scope.cascadeFundAttribute(record.fundType,1,null,record.dict,'attributeType');
                    //初始化收支性质下拉
                    $scope.cascadeFundAttribute(record.fundType,2,record.subFundAttributeId,record.dict,'jyhsFundAttributeId')

                    //初始化分摊
                    if(record.apportionDTOList && record.apportionDTOList.length > 0){
                        angular.forEach(record.apportionDTOList,function(apportion){
                            var appRule = getAppTitleInfo(apportion.entityType);
                            apportion.entityType = appRule.type;
                            apportion.entityTypeName = appRule.name;
                            apportion.titles = appRule.titles;
                        });
                    }

                });
            }
        });
    };

    /**
     * 初始化数据
     */
    var initData = function(){
        //url传过来的参数 编号、日期、制单人
        $scope.evidence = urlParamsSrc;
        //根据id查询凭证明细
        var evidencePromise = getEvidence($scope.evidence.id,$scope.evidence.updateSysUserName);
        //初始化码表
        initDict();
        //初始化分配方式
        evidencePromise.then(function(){
            initEvidenceDetails($scope.evidence.evidenceDetailDTOList);
            initApportionTypeArr($scope.evidence.evidenceDetailDTOList)
            initModiData();
        })
    };

    initData();

    /**
     * 选择产品
     */
    $scope.selectProduct = function(){
        ynuiSelectorService.accountProductSelector(function(items){
        },{});

    };

    /**
     * 通过code值从字典数组中获取name
     * @param arry
     * @param code
     */
    $scope.getDictByCode = function(arry,code){
        var resultArr = $filter('filter')(arry,function(value){
            return value.code == code;
        },true);
        if(resultArr && resultArr.length>0){
            return resultArr[0];
        }
        return {};
    };


    /************************ 凭证明细 START ******************************/
    /**
     * 改变流水类型
     * @param detail
     */
    $scope.changeAccountType = function(detail){
        //(20160718 modify by yanliang)if the accountAmt/feeAmt is empty,set it to evidence detail's borrowAmt/loanAmt
        if(!detail.accountAmt || detail.accountAmt == 0)
            detail.accountAmt = detail.borrowAmt ? detail.borrowAmt : detail.loanAmt;
        //初始化资金流水数组
        detail.fundFlowDTOList = [];
        detail.accountTypeName = $scope.getDictByCode($scope.dict.accountType,detail.accountType).name;
        if(detail.accountType == 3){
            //不适用，清除 流水金额
            detail.accountAmt = "";
            return;
        }
        //创建流水记录
        //(20160613 modify by yanliang)经办人默认为制单人，经办日期默认为制单日期
        var flow = {
            index:detail.index,
            flowType:detail.accountType,
            flowTypeName:detail.accountTypeName,
            flowAmt:detail.accountAmt,
            summary:detail.summary,
            handleSysUserId:$scope.urlParams.makeRsglSysUserId,
            handleSysUserName:$scope.urlParams.makeRsglSysUserName,
            handleTime:$scope.urlParams.makeDate
        };
        if(!detail.fundFlowDTOList){
            detail.fundFlowDTOList = [];
        }
        //添加流水记录到对应的凭证详情
        detail.fundFlowDTOList.push(flow);
        //生成流水号
        getFlowNumber(detail.accountType,flow)
    };


    /**
     * 通过分摊的机构类型 生成标题等信息
     * @param type
     */
    var getAppTitleInfo = function(type){
        //分配规则信息 这里用对象的方式，方便获取key为type
        var appRules = {
            1:{name:'组织机构',type:1,titles:["组织机构"]},
            2:{name:'个人',type:2,titles:["工号","姓名"]},
            3:{name:'阿米巴',type:3,titles:["巴名称","巴类型","巴级别","巴长"]},
            4:{name:'项目',type:4,titles:["项目名称","项目类型","核算性质","项目状态","项目经理"]},
            5:{name:'产品',type:5,titles:["产品名称","产品类型","核算性质","产品状态","产品负责人"]},
            6:{name:'市场区域',type:6,titles:["市场区域名称","上级区域","区域负责人"]},
            7:{name:'分销商',type:7,titles:["分销商名称","管理人"]}
        };
        var resultRule = appRules[type];
        return resultRule ? resultRule : {};
    };

    /**
     * 通过分摊的机构类型生成对象
     * @param appType
     */
    var generAppByType = function(appType,record){
        var appRule = getAppTitleInfo(appType);
        var apportion = {
            entityType:appRule.type,
            entityTypeName:appRule.name,
            titles:appRule.titles,
            totalAmt:record.fundAmt,
            apportedAmt:0,
            unApportedAmt:record.fundAmt
        };
        return apportion
    };

    /**
     * 添加收支记录，或者拆分添加收支记录
     * @param detail
     * @param amt 金额，需要单独传参，因为添加，拆分时，金额不同
     * @param noNumber 是否不生成单号
     */
    var generRecord = function(detail,amt,noNumber){
        //添加收支记录
        //(20160613 modify by yanliang)经办人默认为制单人，经办日期默认为制单日期
        var record = {
            index:detail.index,
            fundType:detail.feeType,
            summary:detail.summary,
            //金额
            fundAmt:amt,
            //码表
            dict:{
                attributeType:[{
                    code:"",
                    name:"请选择"
                }],
                jyhsFundAttributeId:[{
                    code:"",
                    name:"请选择"
                }]
            },
            //收支类别
            attributeType:"",
            //收支类别（2015-12-29 此字段定义与 attributeType 重复，实际上 attributeType查看到未使用，先不删除，以免出错）
            subFundAttributeId:"",
            //收支性质
            jyhsFundAttributeId:"",
            managersId:$scope.urlParams.makeRsglSysUserId,
            managers:$scope.urlParams.makeRsglSysUserName,
            managersDate:$scope.urlParams.makeDate
        };
        //添加一个收支，级联费用类别
        $scope.cascadeFundAttribute(record.fundType,1,null,record.dict,'attributeType');
        //生成收支单号
        if(!noNumber){
            getFundNumber(detail.feeType,record);
        }
        return record;
    };

    /**
     * 清除选中分配规则
     * @param record
     */
    var clearSelectedAppRule = function(detail){
        //清除所有的选中的规则
        angular.forEach(detail.apportionTypeArr,function(item){
            item.value = "";
        });
        if(!detail.fundRecordDTOList || detail.fundRecordDTOList.length == 0){
            //如果没有选择的规则，则直接返回
            return;
        }
        //如果有收支记录，则清除下面所有的分配规则
        angular.forEach(detail.fundRecordDTOList,function(item){
            item.apportionDTOList = [];
        });
    };


    /**
     * 重置明细实际金额
     * @param detail
     */
    var recountDetailAmt = function(detail,num){
        angular.forEach(detail.fundRecordDTOList,function(record){
            recountRecordAmt(record,num)
        });
    };

    /**
     * 改变收支的金额后，对分摊的金额进行计算，以前是直接清除，因为增加了锁定的功能
     * @param record
     */
    var recountRecordAmt = function(record,num){
        angular.forEach(record.apportionDTOList,function(apportion){
            recountApportionAmt(apportion,num);
        });
    };

    /**
     * 重置子分配数据
     * @param apportion
     * @param num
     */
    var recountApportionAmt = function(apportion,num){
        //重新赋值分配总额
        apportion.totalAmt == num ? num : 0;
        //根据已经有的百分比，重置数据
        angular.forEach(apportion.apportionSubDTOList,function(appSub){
            if(appSub.apportionPercentage){
                $scope.calculateAmt('apportionPercentage',appSub,apportion,true);
            }
        });
        //重置设置数据
        resetAppAmt(apportion);
    };

    /**
     * 改变收支类型
     */
    $scope.changeFeeType = function(detail){
        //(20160718 modify by yanliang)if the accountAmt/feeAmt is empty,set it to evidence detail's borrowAmt/loanAmt
        if(!detail.feeAmt || detail.feeAmt == 0)
            detail.feeAmt = detail.borrowAmt ? detail.borrowAmt : detail.loanAmt;
        //(deprecated)清除所有的收支记录
//        detail.fundRecordDTOList = [];
        //(deprecated)清除所有选中的分配规则
        //(2015-12-29)现在不清除，而是根据下面的已经填写的百分比计算
//        clearSelectedAppRule(detail);
        //如果是后续分摊则不添加收支记录
        if(detail.feeType == 3){
            //分摊类型为 修改为 后续分摊
            //（2015-12-24）测试提出不需要更改为后续分摊
//            detail.apportionType = 2;
            //不适用，清除 业务实际金额
            detail.feeAmt = "";
            detail.fundRecordDTOList = [];
            clearSelectedAppRule(detail);
            return;
        }
        //添加收支记录

        //(2015-12-29)如果改变收支类型时已经有收支了，则直接改变编号
        if(!detail.fundRecordDTOList || detail.fundRecordDTOList.length == 0){
            detail.fundRecordDTOList = [];
            var record = generRecord(detail,detail.feeAmt);
            detail.fundRecordDTOList.push(record);
        }else{
            angular.forEach(detail.fundRecordDTOList,function(record){
                var re = generRecord(detail,record.fundAmt,true);
                $.extend(true,record,re);
                //因为dict码表的加载时异步的，而extend应该会生成新的结果对象，所有需要把原来的dict对象地址赋值回去，
                //因为异步回来的数据，是对re.dict上进行的操作
                record.dict = re.dict;
            });
            //单独第一个单号，因为有可能是异步的生成单号
            var promise = getFundNumber(detail.feeType,detail.fundRecordDTOList[0]);
            //因为第一个可能是异步的，所有需要在第一个完成后才开始生成从第二个开始的单号
            if(detail.fundRecordDTOList.length > 1){
                promise.then(function(){
                    for(var i=1;i<detail.fundRecordDTOList.length;i++){
                        getFundNumber(detail.feeType,detail.fundRecordDTOList[i]);
                    }
                });
            }

        }


    };

    /**
     * 改变明细 业务实际金额
     * @param detail
     */
    $scope.changeDetailPracticalAmt = function(detail){
        //(deprecated)如果已经添加了分配了规则，而又想更改金额，则清除选择的规则
//        clearSelectedAppRule(detail);
        if(detail.fundRecordDTOList && detail.fundRecordDTOList.length > 0){
            if(detail.fundRecordDTOList.length == 1){
                //如果没有此明细下只有一条收支记录，则金额跟着改变
                detail.fundRecordDTOList[0].fundAmt = detail.feeAmt;
                //(2015-12-29)改变收支的金额，重新计算下面的分摊
                $scope.changeRecordFundAmt(detail.fundRecordDTOList[0]);
            }else{
                //多条则清空
                angular.forEach(detail.fundRecordDTOList,function(item){
                    item.fundAmt = 0;
                    //(2015-12-29)改变收支的金额，重新计算下面的分摊
                    $scope.changeRecordFundAmt(item);
                });
            }
        }
    };

    /**
     * 改变分配类型
     */
    $scope.changeApportionType = function(detail){
        clearSelectedAppRule(detail);
    };

    /**
     * 拆分收支记录
     * @param detail
     */
    $scope.splitRecord = function(detail){
        //拆分收支记录（也就是添加收支记录到此明细下面）
        var record = generRecord(detail,0);
        detail.fundRecordDTOList.push(record);
        //拷贝第一个收支记录下的所有子分摊规则
        record.apportionDTOList = angular.copy(detail.fundRecordDTOList[0].apportionDTOList);

        //拆分后把所有的收支记录金额设置为0
        angular.forEach(detail.fundRecordDTOList,function(item){
            item.fundAmt = 0;
            $scope.changeRecordFundAmt(item);
        });

    };

    /**
     * 删除record收支记录
     * @param $index
     */
    $scope.deleteRecord = function(index,detail){
        detail.fundRecordDTOList.splice(index,1);
        //只有一条时，则将唯一条的金额变为详情的‘实际金额’
        if(detail.fundRecordDTOList.length == 1){
            detail.fundRecordDTOList[0].fundAmt = detail.feeAmt;
            $scope.changeRecordFundAmt(detail.fundRecordDTOList[0]);
        }
        //(deprecated)清除下面的分摊
//        clearSelectedAppRule(detail);
    };

    /**
     * 收起展开分摊
     * @param apportion
     */
    $scope.toggleApportion = function(apportion){
        apportion.isExpandApp = !apportion.isExpandApp;
    };

    /**
     * 凭证明细更改流水金额的操作
     * @param detail
     */
    $scope.changeDetailFlowAmt = function(detail){
        if(detail.fundFlowDTOList){
            //凭证明细已经生成了流水信息，而又想更改流水金额
            //如果没拆分，就直接更改了
            if(detail.fundFlowDTOList.length == 1){
                detail.fundFlowDTOList[0].flowAmt = detail.accountAmt;
            }else{

                //TODO 目前直接清0 不进行总数计算
                angular.forEach(detail.fundFlowDTOList,function(item){
                    item.flowAmt = 0;
                });
                //如果有拆分，就算一算总数是否大于新的流水金额，大于的话则全部清0
//                var flowAmtTotal = 0;
//                angular.forEach(detail.fundFlowDTOList,function(item){
//                    flowAmtTotal += item.flowAmt;
//                });
//                //大于的话则全部清0
//                if(flowAmtTotal > detail.flowAmt){
//                    angular.forEach(detail.fundFlowDTOList,function(item){
//                        item.flowAmt = 0;
//                    });
//                }
            }
        }
    };


    /**
     * 流水金额 自定义验证对象
     */
    $scope.accountAmtCustomVali = {
        fun:function(scope){
            if(scope && scope.$parent && scope.$parent.item){
                var parentItem = scope.$parent.item;
                var parentAmt = parseFloat(parentItem.borrowAmt ? parentItem.borrowAmt : parentItem.loanAmt);
                //如果借方、贷方金额为为负数，则以正数处理
                parentAmt = parentAmt < 0 ? -(parentAmt) : parentAmt;
                if(parseFloat(parentItem.accountAmt) > parentAmt){
                    return false;
                }
            }

            return true;
        },
        content:"流水金额必须小于或等于借方或贷方金额！"
    };

    /**
     * 业务实际金额 自定义验证对象
     */
    $scope.feeAmtCustomVali = {
        fun:function(scope){
            if(scope && scope.$parent && scope.$parent.item){
                var parentItem = scope.$parent.item;
                var parentAmt = parseFloat(parentItem.borrowAmt ? parentItem.borrowAmt : parentItem.loanAmt);
                //如果借方、贷方金额为为负数，则以正数处理
                parentAmt = parentAmt < 0 ? -(parentAmt) : parentAmt;
                if(parseFloat(parentItem.feeAmt) > parentAmt){
                    return false;
                }
            }

            return true;
        },
        content:"业务实际金额必须小于或等于借方或贷方金额！"
    };

    /**
     * 判断是否有 流水金额，或者业务实际金额超过借方或贷方金额
     */
    $scope.hasAmtExceed = function(){

        var has = false;
        for(var i in $scope.evidence.evidenceDetailDTOList){
            var detail = $scope.evidence.evidenceDetailDTOList[i];
            var parentAmt = parseFloat(detail.borrowAmt ? detail.borrowAmt : detail.loanAmt);
            //如果借方、贷方金额为为负数，则以正数处理
            parentAmt = parentAmt < 0 ? -(parentAmt) : parentAmt;
            if(parseFloat(detail.feeAmt) > parentAmt || parseFloat(detail.accountAmt) > parentAmt){
                has = true;
                break;
            }
        }
        return has;

    };


    /************************ 凭证明细 END ******************************/


    /*************************  资金流水处理START  **********************************/

    /**
     * 是否有 资金流水处理
     */
    $scope.hasFundFlow = function(){
        var has = false;
        for(var i in $scope.evidence.evidenceDetailDTOList){
            var detail = $scope.evidence.evidenceDetailDTOList[i];
            if(detail.fundFlowDTOList && detail.fundFlowDTOList.length > 0){
                has = true;
                break;
            }
        }
        return has;
    };

    /**
     * 拆分后可输入流水金额
     * @param detail
     * @param flow
     */
    $scope.changeFlowAmt = function(detail,flow){
        //先算出已经分配的资金总额
//        var splitedAmt = 0;
//        angular.forEach(detail.fundFlowDTOList,function(item){
//            splitedAmt += item.flowAmt;
//        });
//        //如果分配的总额大于了明细的总额，则减值付给此流水
//        if((splitedAmt+flow.flowAmt) > detail.flowAmt){
//            flow.flowAmt = detail.flowAmt - splitedAmt;
//        }
    };

    /**
     * 选择资金账户
     * @param flow
     */
    $scope.selectFundAccount = function(flow){
        ynuiSelectorService.accountFundPoolSelector(function(item){
            if(!item || !item.seleted){
                return;
            }
            //资金池账户类型:1.银行账户 2.库存资金
            flow.fundType = item.type;
            var selected = item.seleted;
            if(item.type == 1){
                flow.szglBankCardId = selected.id;
                flow.fundName = selected.cardName;
            }else{
                flow.szglRepertoryFundId = selected.id;
                flow.fundName = selected.repertoryName;
            }
//            $scope.$apply();
        },{singleChoice:true});
    };

    /**
     * 拆分资金流水
     * @param flow
     */
    $scope.splitFlow = function(detail){
        //拆分的话，把此明细下的所有流水金额全变成0
        angular.forEach(detail.fundFlowDTOList,function(item){
            item.flowAmt = 0;
        });
        //创建流水记录
        //(20160613 modify by yanliang)经办人默认为制单人，经办日期默认为制单日期
        var flow = {
            index:detail.index,
            flowType:detail.accountType,
            flowTypeName:detail.accountTypeName,
            flowAmt:0,
            summary:detail.summary,
            handleSysUserId:$scope.urlParams.makeRsglSysUserId,
            handleSysUserName:$scope.urlParams.makeRsglSysUserName,
            handleTime:$scope.urlParams.makeDate
        };

        //生成流水号
        getFlowNumber(detail.accountType,flow);
        detail.fundFlowDTOList.push(flow);
    };

    /**
     * 删除拆分的资金流水
     * @param detail
     * @param index
     */
    $scope.deleteSplitFlow = function(detail,index){
        detail.fundFlowDTOList.splice(index,1);
        //删除到只剩一条后，将流水金额设置成明细的流水金额
        if(detail.fundFlowDTOList.length == 1){
            detail.fundFlowDTOList[0].flowAmt = detail.accountAmt;
        }
    };

    /**
     * 选择流水经办人
     */
    $scope.selectUser = function(obj,nameKey,idKey){
        ynuiSelectorService.userSelector(function(users){

            obj[nameKey] = users.name;
            obj[idKey] = users.id;

            $scope.$apply();
        },{gridOptions:{useSingleChoice:true},inServiceStates:0});
    };

    /**
     * 初始化选择器数据
     * @param initData
     * @param keys
     */
    var initSelectorData = function(initData,keys){
        var selected = [];
        angular.forEach(initData,function(item){
            var obj = {
                id:item.entityTypeId
            };
            for(var i in keys){
                obj[keys[i]] = item.titleVal[i];
            }
            selected.push(obj);
        });
        return selected;
    };

    /**
     * 选择器选择后，进行初始操作
     * @param arr
     * @param selected
     */
    var initAfterSelect = function(arr,selected){
        var arrHas = [];
        var selectedHas = [];
        for(var i in selected){
            var has = false;
            for(var j in arr){
                if(selected[i].id == arr[j].entityTypeId){
                    arrHas.push(arr[j]);
                    has = true;
                    arr.splice(j,arr);
                    break;
                }
            }
            if(!has){
                selectedHas.push(selected[i]);
            }
        }
        arr.splice(0,arr.length);
        angular.forEach(arrHas,function(item){
            arr.push(item);
        });
        selected.splice(0,selected.length);
        angular.forEach(selectedHas,function(item){
            selected.push(item);
        });


    };

    /**
     * 添加分摊下面的分摊机构（个人..等）
     * @param apption
     */
    $scope.addAppSub = function(apportion){
//        1:{name:'组织机构',type:1,titles:["组织机构"]},
//        2:{name:'个人',type:2,titles:["工号","姓名"]},
//        3:{name:'阿米巴',type:3,titles:["巴名称","巴类型","巴级别","巴长"]},
//        4:{name:'项目',type:4,titles:["项目名称","项目类型","核算性质","项目状态","项目经理"]},
//        5:{name:'产品',type:5,titles:["产品名称","产品类型","核算性质","产品状态","产品负责人"]},
//        6:{name:'市场区域',type:6,titles:["市场区域名称","上级区域","区域负责人"]},
//        7:{name:'分销商',type:7,titles:["分销商名称","管理人"]}
        //共同初始化的参数
        var commonInit = {
            apportionAmt:0,
            apportionPercentage:0
        };
        switch (apportion.entityType){
            //组织机构
            case 1:
                ynuiSelectorService.orgSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);

                    angular.forEach(items,function(item){
                        var org = {
                            entityTypeId:item.id,
                            //"组织机构"
                            titleVal:[item.name]
                        };
                        angular.extend(org,commonInit);
                        apportion.apportionSubDTOList.push(org);
                    });
                    $scope.$apply();
                },{singleChoice:false});
                break;
            //个人
            case 2:
                ynuiSelectorService.userSelector(function(items){
                    //TODO 目前先清空直接覆盖，以后可以做反选的功能，这里7个规则都先这样做
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);

                    angular.forEach(items,function(item){
                        var person = {
                            entityTypeId:item.id,
                            //"工号","姓名"
                            titleVal:[item.jobNumber,item.name]
                        };
                        angular.extend(person,commonInit);
                        apportion.apportionSubDTOList.push(person);
                    });
                    $scope.$apply();
                },{inServiceStates:0});
                break;
            //阿米巴
            case 3:
                //设置默认选中
                var selected = initSelectorData(apportion.apportionSubDTOList,['name','amoebaType','amoebaLevel','amoebaSysUserName']);
                ynuiSelectorService.accountAmoebaSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);

                    angular.forEach(items,function(item){
                        var amoeba = {
                            entityTypeId:item.id,
                            //"巴名称","巴类型","巴级别","巴长"
                            titleVal:[item.name,item.amoebaType,(item.amoebaLevel == 1 ? "一级巴":"二级巴"),item.amoebaSysUserName],
                            //默认 固定消费
                            feeType:1
                        };
                        angular.extend(amoeba,commonInit);
                        apportion.apportionSubDTOList.push(amoeba);
                        $scope.$apply();
                    });
                    $scope.$apply();
                },{selected:selected});
                break;
            //项目
            case 4:
                ynuiSelectorService.accountProjectSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);
                    angular.forEach(items,function(item){
                        var project = {
                            entityTypeId:item.id,
                            //"项目名称","项目类型","核算性质","项目状态","项目经理"
                            titleVal:[item.projectName,item.projectTypeCodeShow,(item.projectProperties == 1 ? "成本型项目":"收入型项目"),item.projectStatusCode,item.managerName]
                        };
                        angular.extend(project,commonInit);
                        apportion.apportionSubDTOList.push(project);
                        $scope.$apply();
                    });
                    $scope.$apply();
                },{});
                break;
            //产品
            case 5:
                ynuiSelectorService.accountProductSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);
                    angular.forEach(items,function(item){
                        var product = {
                            entityTypeId:item.id,
                            //"产品名称","产品类型","核算性质","产品状态","产品负责人"
                            titleVal:[item.name,item.productTypeName,item.productAccountNatureName,item.productStatusName,item.productSysUserName]
                        };
                        angular.extend(product,commonInit);
                        apportion.apportionSubDTOList.push(product);
                    });
                    $scope.$apply();
                },{});
                break;
            //市场区域
            case 6:
                ynuiSelectorService.accountAreaSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);
                    angular.forEach(items,function(item){
                        var area = {
                            entityTypeId:item.id,
                            //"市场区域名称","上级区域","区域负责人"
                            titleVal:[item.name,item.pareName,item.userName]
                        };
                        angular.extend(area,commonInit);
                        apportion.apportionSubDTOList.push(area);
                    });
                    $scope.$apply();
                },{});
                break;
            //分销商
            case 7:
                ynuiSelectorService.accountDistributorSelector(function(items){
                    if(!apportion.apportionSubDTOList){
                        apportion.apportionSubDTOList = [];
                    }
                    initAfterSelect(apportion.apportionSubDTOList,items);
                    angular.forEach(items,function(item){
                        var distributor = {
                            entityTypeId:item.id,
                            //"分销商名称","管理人"
                            titleVal:[item.name,item.adminName]
                        };
                        angular.extend(distributor,commonInit);
                        apportion.apportionSubDTOList.push(distributor);
                    });
                    $scope.$apply();
                },{});
                break;
        }
    };

    /**
     * 是否是100%
     */
    var isOneHundredPer = function(apportion){
        var percentage = 0;
        angular.forEach(apportion.apportionSubDTOList,function(item){
            if(!item.apportionPercentage){
                return;
            }
            percentage += parseFloat(item.apportionPercentage) * 1000;
        });
        if(parseFloat(100)*1000 == percentage){
            return null;
        }else{
            return (parseFloat(100)*1000 - percentage)/1000;
        }
    };

    /**
     * 小数相加
     * @param sour
     * @param add
     */
    var calculateFloat = function(sour,add){
        var result = (parseFloat(sour)*1000 + parseFloat(add)*1000)/1000;
        return result;
    };

    /**
     * 重新设置分配、未分配金额
     * @param apportion
     */
    var resetAppAmt = function(apportion){
        //更新总金额、未分配等
        //totalAmt
        //apportedAmt
        //unApportedAmt
        apportion.apportedAmt = 0.00;
        //计算已经分配
        angular.forEach(apportion.apportionSubDTOList,function(as){
            if(as.apportionAmt){
                //有string老是除不尽，需要乘1000
                apportion.apportedAmt += (parseFloat(as.apportionAmt))*1000
            }
        });
        //需要乘1000，0.05*100 变成了 50.000000001....
        //因为前面乘了1000，需要除1000 变为小数
        apportion.apportedAmt = apportion.apportedAmt/1000;

        //计算未分配，小数老是除不尽，只有先乘后除
        apportion.unApportedAmt = ((parseFloat(apportion.totalAmt)*1000) - (apportion.apportedAmt*1000))/1000;


        var leftHundred = isOneHundredPer(apportion);
        //如果每一个分配都已经输入了金额和比例了，直接将最后的一个填充剩余的金额和占比
        //TODO 有问题，稍后做
//        if(leftHundred || apportion.unApportedAmt != 0){
//            for(var i in apportion.apportionSubDTOList){
//                //到了最后一位了，还没有break;
//                if(i == apportion.apportionSubDTOList.length-1){
//                    apportion.apportionSubDTOList[i].apportionAmt = calculateFloat(apportion.apportionSubDTOList[i].apportionAmt,apportion.unApportedAmt);
//                    apportion.apportionSubDTOList[i].apportionPercentage = calculateFloat(apportion.apportionSubDTOList[i].apportionPercentage,leftHundred);
//                    apportion.unApportedAmt = 0;
//                    break;
//                }
//                if(!apportion.apportionSubDTOList[i].apportionAmt || !apportion.apportionSubDTOList[i].apportionPercentage){
//                    break;
//                }
//
//            }
//        }

        //!!!如果已经是百分之百了，但是未分配还有值，则将其加到最后一位（不为空）
        if(!leftHundred && apportion.unApportedAmt != 0){
            for(var i=apportion.apportionSubDTOList.length - 1;i>=0;i--){
                if(apportion.apportionSubDTOList[i].apportionAmt && apportion.apportionSubDTOList[i].apportionPercentage){
                    apportion.apportionSubDTOList[i].apportionAmt = calculateFloat(apportion.apportionSubDTOList[i].apportionAmt,apportion.unApportedAmt);
                    apportion.unApportedAmt = 0;
                    break;
                }
            }
        }
        //!!!但是钱已经分配完了，但百分比还不为100%，则将剩下的百分比加（减）到最后一位
        if(leftHundred && apportion.unApportedAmt == 0){
            for(var i=apportion.apportionSubDTOList.length - 1;i>=0;i--){
                if(apportion.apportionSubDTOList[i].apportionAmt && apportion.apportionSubDTOList[i].apportionPercentage){
                    apportion.apportionSubDTOList[i].apportionPercentage = calculateFloat(apportion.apportionSubDTOList[i].apportionPercentage,leftHundred);
                    break;
                }
            }
        }


    };

    /**
     * 输入金额，或者比例时计算金额，或者比例。以及改变分配额
     * @param key
     * @param appSub
     * @param apportion
     * @param notReset
     */
    $scope.calculateAmt = function(key,appSub,apportion,notReset){
        if(!appSub[key]){
            return;
        }

        var num = parseFloat(appSub[key]).toFixed(2);
        //输入金额
        if(key == 'apportionAmt'){
            if(apportion.totalAmt == 0){
                //总额为0时，输入金额，和百分比变为0
                appSub[key] = 0;
                appSub.apportionPercentage = 0;
            }else{
                appSub.apportionPercentage = parseFloat((num/apportion.totalAmt)*100).toFixed(1);
            }
        }else{
            //输入百分比
            var percentage = parseFloat(num)*0.01;
            appSub.apportionAmt = parseFloat(percentage*apportion.totalAmt).toFixed(2);
        }
        if(!notReset){
            resetAppAmt(apportion);
        }
    };

    /**
     *
     * @param index
     * @param apportion
     */
    $scope.deleteAppSub = function(index,apportion){
        apportion.apportionSubDTOList.splice(index,1);
        resetAppAmt(apportion);
    };

    /*************************  资金流水处理结束  **********************************/

    /*************************  自动生成流水号，生成单号 开始  **********************************/

    /**
     * 生成流水号
     * @param accountType
     */
    var getFlowNumber = function(accountType,obj){
        if(($scope.generedLRFlowNumer && accountType==1) || ($scope.generedLCFlowNumer && accountType==2)){
            //如果已经查询出来了最新的流水号，则在之前的上面+1

            obj.flowNumber = accountType==1 ? ++$scope.generedLRFlowNumer : ++$scope.generedLCFlowNumer;
            return;
        }
        $http.post(basePath +"/szglEvidenceRecordProcess/getFlowNumber",null,{params:{accountType:accountType}}).success(function (data) {
            if(data.status == 0){
                obj.flowNumber = data.result;
                /**
                 * 生成流水号后存一下
                 */
                if(accountType==1){
                    //流入
                    $scope.generedLRFlowNumer = obj.flowNumber;
                }else{
                    //流出
                    $scope.generedLCFlowNumer = obj.flowNumber;
                }
            }
        });
    };

    /**
     * 生成收支单号
     * @param fundNumber
     */
    var getFundNumber = function(fundType,obj){
        if(($scope.generedZCFundNumer && fundType==1) || ($scope.generedSRFundNumer && fundType==2)){
            //收入支出的前缀不同，所有需要分开处理
            var generedFundNumer = fundType == 1 ? $scope.generedZCFundNumer : $scope.generedSRFundNumer;

            //如果已经查询出来了最新的流水号，则在之前的上面+1
            //收支单号是string字符串，先截取前三个字符，再++
            var fundNumArr = generedFundNumer.split("-");
            var fundNumberTitle = fundNumArr[0]+"-";
            var fundNumberValue = parseInt(fundNumArr[1]);

            generedFundNumer = fundNumberTitle+(++fundNumberValue);
            if(fundType == 1){
                $scope.generedZCFundNumer = generedFundNumer;
            }else{
                $scope.generedSRFundNumer = generedFundNumer;
            }
            obj.fundNumber = generedFundNumer;
            //模拟promise格式
            return {then:function(callback){callback()}};
        }
        //返回promise
        return $http.post(basePath +"/szglEvidenceRecordProcess/getFundNumber",null,{params:{fundType:fundType}}).success(function (data) {
            if(data.status == 0){
                obj.fundNumber = data.result;
                /**
                 * 生成流水号后存一下
                 */
                if(fundType == 1){
                    $scope.generedZCFundNumer = obj.fundNumber;
                }else{
                    $scope.generedSRFundNumer = obj.fundNumber;
                }
            }
        });
    };

    /*************************  自动生成流水号，生成单号 结束  **********************************/

    /**
     * check勾选分配方式
     * @param detail
     * @param apportion
     */
    $scope.changeAppRule = function(appRule,detail){
        //是反选
        if(!appRule.value){
            //分配规则在数组中的位置
            var ruleIndex = null;
            //取数组的第一个就行了，因为拆分的记录下面分配都相同
            for(var i in detail.fundRecordDTOList[0].apportionDTOList){
                var a = detail.fundRecordDTOList[0].apportionDTOList[i];
                if(a.entityType == appRule.type){
                    ruleIndex = i;
                    break;
                }
            }
            if(ruleIndex){
                //开始删除记录下面的刚才反选的分配
                angular.forEach(detail.fundRecordDTOList,function(item){
                    item.apportionDTOList.splice(ruleIndex,1);
                });
            }
        }

        //是勾选
        if(appRule.value){
            //给拆分下面所有的分摊添加分摊规则
            angular.forEach(detail.fundRecordDTOList,function(item){
                //如果为勾选，在分摊详情下面添加一条分摊记录
                var apportion = generAppByType(appRule.type,item);
                if(!item.apportionDTOList){
                    item.apportionDTOList = [];
                }
                item.apportionDTOList.push(apportion);
            });
        }

    };

    /**
     * 核算资金级联
     * @param fundType
     * @param attributeType
     * @param id 父级id
     * @param obj
     * @param key
     */
    $scope.cascadeFundAttribute = function(fundType,attributeType,id,obj,key,record){
        var getParams = {
            fundType:fundType,
            attributeType:attributeType,
            id:id
        };
        obj[key] = [];
        //请选择
        obj[key].push({
            code:"",
            name:"请选择"
        });
        //级联性质时需要马上清除选中的性质
        if(attributeType == 2 && record){
            record.jyhsFundAttributeId = "";
        }
        $http.post(basePath +"/jyhsFundAttribute/queryJYHSFundAttributeByAttributeType",null,{params:getParams}).success(function (data) {
            if(data && data.length>0){
                angular.forEach(data,function(item){
                    obj[key].push({
                        code:item.id,
                        name:item.name
                    });
                });
            }
        });
    };

    /**
     * 拆分后可以更改金额，对下面的分摊进行更改
     * @param record
     */
    $scope.changeRecordFundAmt = function(record){
        if(record.apportionDTOList && record.apportionDTOList.length > 0){
            angular.forEach(record.apportionDTOList,function(item){
                //重置金额
                item.totalAmt = record.fundAmt;
                item.apportedAmt = 0;

                //(2015-12-29)改变金额了，重新设置分配金额
                recountApportionAmt(item,item.totalAmt);

                //(deprecated)
//                item.unApportedAmt = record.fundAmt;
//                //清空添加的子选项
//                item.apportionSubDTOList = [];
            });
        }

    };

    /**
     * 判断是否还有未分摊的
     * @param record
     * @param detail
     */
    $scope.hasUnapportedAmt = function(record,detail){
        var recordArr = [];
        //如果有详情
        if(detail){
            angular.forEach(detail,function(d){
                angular.forEach(d.fundRecordDTOList,function(r){
                    recordArr.push(r);
                });
            });

        }
        //如果传入的是数组
        if(record instanceof Array){
            recordArr = record;
        }else{
            //是对象
            recordArr.push(record);
        }

        //遍历所有的apportion看是否有未分配的
        var has = null;
        for(var i in recordArr){
            var re = recordArr[i];
            if(!re){
                continue;
            }
            for(var j in re.apportionDTOList){
                var ap = re.apportionDTOList[j];
                if(parseFloat(ap.unApportedAmt) > 0 || parseFloat(ap.unApportedAmt)<0){
                    has = parseFloat(ap.unApportedAmt) > 0 ? 'unApp' : 'excessApp';
                    break;
                }
            }
            if(has){
                break;
            }
        }

        return has;

    };

    /**
     * 拆分流水金额时，流水金额加上不等于  详情的流水金额
     * @returns {boolean}
     */
    $scope.hasUnaccountAmt = function(){
        var has = false;
        for(var i in $scope.evidence.evidenceDetailDTOList){
            //遍历详情
            var detail = $scope.evidence.evidenceDetailDTOList[i];
            //如果是不适用则不进行验证
            if(detail.accountType == 3){
                continue;
            }
            var flowAmt = 0;
            //如果启用了流水，则不能为空
            if(!detail.accountAmt){
                return 'empty';
            }
            for(var j in detail.fundFlowDTOList){
                //遍历拆分流水
                var flow = detail.fundFlowDTOList[j];
                flowAmt += parseFloat(flow.flowAmt)
            }
            if(parseFloat(detail.accountAmt) != flowAmt){
                has = true;
                break;
            }
        }
        return has;
    };

    /**
     * 拆分收支记录金额，拆分加上不等于  详情的实际金额
     * @returns {boolean}
     */
    $scope.hasUnrecordAmt = function(){
        var has = false;
        for(var i in $scope.evidence.evidenceDetailDTOList){
            //遍历详情
            var detail = $scope.evidence.evidenceDetailDTOList[i];
            //如果是不适用则不进行验证
            if(detail.feeType == 3){
                continue;
            }
            if(!detail.feeAmt){
                return 'empty';
            }
            var recordAmt = 0;
            for(var j in detail.fundRecordDTOList){
                //遍历收支记录
                var record = detail.fundRecordDTOList[j];
                recordAmt += parseFloat(record.fundAmt)
            }
            if(parseFloat(detail.feeAmt) != recordAmt){
                has = true;
                break;
            }
        }
        return has;
    };

    /**
     * 拼接流水以及收支的涉及业务系统
     * @param data
     */
    var joinReferSystemCodes = function(dataList){
        if(!dataList || dataList.length == 0){
            return;
        }
        angular.forEach(dataList,function(data){
            if(data.referSystemCodesList && data.referSystemCodesList.length > 0){
                var referSystemCodesL = [];
                angular.forEach(data.referSystemCodesList,function(cod){
                    referSystemCodesL.push(cod.code);
                });
                data.referSystemCodes = referSystemCodesL.join(',');
            }
        });

    };

    /**
     * 提交
     */
    $scope.submit = function(){
        var resultEvidence = angular.copy($scope.evidence);

        //开始验证
        //验证表单输入
        if($scope.evidenceForm.$invalid){
            return;
        }
        //验证是否有 流水金额，或者业务实际金额超过借方或贷方金额
        if($scope.hasAmtExceed()){
            return;
        }
        //验证是否有未分摊的
        var hasUnapp = $scope.hasUnapportedAmt(null,$scope.evidence.evidenceDetailDTOList)
        if(hasUnapp){
            var errorMsg = hasUnapp == 'unApp' ? '存在有未分配的金额！' : '存在有分配金额超出总金额！';
            ynNotification.notify('error',errorMsg);
            return;
        }
        //拆分流水时，流水金额验证
        var hasUnacc = $scope.hasUnaccountAmt();
        if(hasUnacc){
            var errorMsg = hasUnacc == 'empty' ? '存在流水金额为空！' : '存在拆分的流水金额不等于凭证明细的流水金额！';
            ynNotification.notify('error',errorMsg);
            return;
        }
        //拆分收支时，收支金额验证
        var hasUnRec = $scope.hasUnrecordAmt();
        if(hasUnRec){
            var errorMsg = hasUnRec == 'empty' ? '存在实际金额为空！' : '存在拆分的收支记录金额不等于凭证明细的业务实际金额！';
            ynNotification.notify('error',errorMsg);
            return;
        }

        //拼接分摊规则字符串
        angular.forEach(resultEvidence.evidenceDetailDTOList,function(item){
            var rule = [];
            angular.forEach(item.apportionTypeArr,function(r){
                if(r.value){
                    rule.push(r.value);
                }
            });
            var ruleStr = rule.join(',');
            item.apportionRule = ruleStr;

            joinReferSystemCodes(item.fundFlowDTOList);
            joinReferSystemCodes(item.fundRecordDTOList);
        });

        resultEvidence.evidenceRecordId = resultEvidence.id;

        $http.post(basePath +"/szglEvidenceRecordProcess/saveEvidenceProcess",resultEvidence).success(function (data) {
            if(data.status == 0){
                ynNotification.notify('success','操作成功！');
                //跳转回凭证管理页面
                $location.path("/site/szgl/evidenceManage/evidenceRecord").search({});
            }else{
                ynNotification.notify('error',data.message);
            }
        });
    };

    /**
     *  取消返回
     */
    $scope.cancel = function(){
        $location.path("/site/szgl/evidenceManage/evidenceRecord").search({});
    };


}]);
