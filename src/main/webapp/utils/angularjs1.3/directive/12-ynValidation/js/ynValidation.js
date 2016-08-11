angular.module("yn.utils").directive("ynValidation", function () {
    return {
        restrict: 'A',//只能作为属性使用
        scope: {
            ynValidation: "=",
            customFun: "&",
            tipway: "@",
            tipdom: "@"
        },
        require: 'ngModel',//此指令依赖于ng-model指令，是为了是用当前表单元素的校验状态
        link: function ($scope, $element, $attrs, ctrl) {
            //整个方法需要设置延迟，目的是为在ngModal模态弹出框全部渲染完成了以后再执行，才能找到带onfocus的确认按钮。
            window.setTimeout(function () {
                if ($scope.ynValidation && $scope.ynValidation.customContent) {
                    $scope.ynValidation.custom = {
                        fun: $scope.customFun,
                        content: $scope.ynValidation.customContent
                    }
                }
                var form = $element.closest("form");
                if (!(form.attr("isBind") == "isBind") || $attrs.bindsub != undefined) {
                    //查找所有的带有验证指令的元素
                    var children = form.find("[yn-validation]");
                    //查找模态弹出框的确定按钮
                    var focButton = $(form.parents("tbody")[0]).find("[autofocus]");
                    //如果此页面有需要动态加入的验证框时
                    var isDynamic = form.attr('dynamic') != undefined ? true : false;
                    //如果有
                    if (focButton && focButton.length > 0) {
                        $(focButton).click(function () {
                            //如果有动态加入的验证框，每次点击全局验证，需要重新寻找所有的需要验证的栏
                            if (isDynamic) {
                                children = form.find("[yn-validation]");
                            }
                            children.trigger('ynVali');
//                            angular.forEach(children,function(child){
//                                $(child).keyup();
//                            });
                        });
                    }
                    //标记此form已经绑定过全部验证按钮
                    form.attr("isBind", "isBind");

                    //普通的按键
                    var button = form.find("[subButt]");
                    if (button.length > 0) {
                        button.click(function () {
                            //如果有动态加入的验证框，每次点击全局验证，需要重新寻找所有的需要验证的栏
                            if (isDynamic) {
                                children = form.find("[yn-validation]");
                            }
                            angular.forEach(children, function (child) {
                                $(child).trigger('ynVali');
                            });
                        });
                    }
                }

                //初始化，如果没有传初始值
                if (!$scope.ynValidation) {
                    //后面加入提示信息的默认为block
                    $scope.ynInnerValidation = {
                        type: "block",//可选值为inline和block
                        content: ""
                    };

                    $scope.custom = {
                        fun: function () {
                            return true;
                        }
                    };
                    $scope.tipHead = "";
                } else {
                    //如果用户没有输入自定义验证方法
                    if (!$scope.ynValidation.custom) {
                        $scope.custom = {
                            fun: function () {
                                return true;
                            }
                        };
                    } else {
                        $scope.custom = $scope.ynValidation.custom;
                    }

                    //初始化是否为输入组
                    $scope.inputGroup = $scope.ynValidation.inputGroup;
                    //初始化提示头
                    $scope.tipHead = $scope.ynValidation.tipHead ? $scope.ynValidation.tipHead : "";
                    //是否是点击判断（类似组织机构这样）
                    $scope.isClick = $scope.ynValidation.isClick;

                    if (!$scope.ynValidation.type) {
                        $scope.ynValidation.type = "block";
                    }

                    if (!$scope.ynValidation.content) {
                        $scope.ynValidation.content = "";
                    }

                    $scope.ynInnerValidation = $scope.ynValidation;
                }

                $scope.ynValidationType = $scope.ynInnerValidation.type;
                $scope.ynValidationContent = $scope.ynInnerValidation.content;

                //需要验证的字段名
                if ($element.parent().prev("label") && !$scope.tipHead) {
                    $scope.tipHead = $element.parent().prev("label").text();
                    $scope.tipHead = $scope.tipHead.replace(/\n|\*|\t|\r|\s+\ /g, "");
                }

                //使用验证信息在下方的验证方法，生成html的方法
                var generValiInfoDownWay = function () {
                    //默认加入为block
                    $scope.tipHtml = '<span class="help-block" style="display:none;font-size:12px;white-space: normal;word-break:break-all;"></span>';                //如果为inline
                    if ($scope.ynValidationType == "inline") {
                        $scope.tipHtml = '<span class="help-inline" style="display:none;font-size:12px"></span>';
                        $element.addClass("input-inline");
                    }

                    //判断是否是input-group
                    $scope.element = $scope.inputGroup ? $element.closest(".input-group") : $element;

                    $scope.element.after($scope.tipHtml);
                    //使用jq获得刚刚添加的span元素
                    $scope.tipSpan = $scope.element.next('span');

                    //检测是否之前下面就有灰色的提示信息(有行内 help-inline 和 下面help-block)需要判断两次是否都有
                    var emphasisInfoInline = $scope.element.next().next("[class='help-block']");
                    var emphasisInfoBlock = $scope.element.next().next("[class='help-inline']");
                    if (emphasisInfoInline.length > 0 || emphasisInfoBlock.length > 0) {
                        $scope.emphasisInfo = emphasisInfoInline.length > 0 ? angular.element(emphasisInfoInline[0]) : angular.element(emphasisInfoBlock[0]);
                    }
                };

                /*
                 * 悬浮提示操作
                 */
                var tipwrap, tiptpl, tipdom;
                var hint = {
                    generator:function(){
                        if ($scope.tipdom) {
                            tipdom = angular.element('#' + $scope.tipdom);
                        } else if ($attrs.type == 'checkbox' || $attrs.type == 'radio') {
                            var checkboxs = angular.element('[validat-group=' + $attrs.validatGroup + ']');
                            tipdom = angular.element(checkboxs[0]).parent();
                        } else {
                            tipdom = $element;
                        }
                        tipwrap = angular.element('<div class="gtooltip-wrap"></div>');
                        tiptpl = angular.element(
                            '<div class="gtooltip">' +
                            '<div class="tooltip-arrow"></div>' +
                            '<div class="tooltip-inner"></div>' +
                            '</div>');
                        tipwrap.css({'height': tipdom.outerHeight(), 'display': tipdom.css('display')});
                        tiptpl.addClass('top');
                        if (!tipdom.parent().hasClass('gtooltip-wrap')) {
                            tipdom.wrap(tipwrap);
                            tiptpl.insertAfter(tipdom);
                            if (tipdom.parents('td').css('overflow') == 'hidden') {
                                tipdom.parents('td').css('overflow', 'visible');
                            }
                        }
                        tiptpl.appendTo(angular.element('body'));
                        if(!tipdom.parents('.gtooltip-wrap').find('.gtooltip').length){
                            tiptpl.insertAfter(tipdom);
                        }
                    },
                    show:function(){
                        var isPiker = function(){
                            if($attrs.ynuiDatepicker != undefined || $attrs.ynuiTimepicker != undefined)
                                return true;
                        };
                        tipdom.addClass('focus-true');
                        tiptpl = tipdom.parent().find('.gtooltip');
                        tiptpl.find('.tooltip-inner').html($scope.valiByStep());
                        tiptpl.css({'position': 'fixed'});
                        tiptpl.appendTo('body');
                        if (tiptpl.find('.tooltip-inner').css('width')) {
                            tiptpl.css({'display':'block','left':'-500px'});
                            tiptpl.find('.tooltip-inner').css({'width': 'auto'});
                        }
                        tiptpl.find('.tooltip-inner').css({'width': tiptpl.outerWidth() + 1});
                        if(!tipdom.parents('.gtooltip-wrap').find('.gtooltip').length){
                            tiptpl.insertAfter(tipdom);
                        }
                        tiptpl.css({'position': 'absolute'});
                        var bottom, left;
                        bottom = (tipdom.outerHeight() - 3);
                        left = 0;
                        tiptpl.css({'bottom': bottom, 'left': left});
                        if ($scope.checkAll) {
                            if (angular.element('.focus-true').length > 0) {
                                angular.element('.focus-true')[0].focus();
                            }
                        } else {
                            window.setTimeout(function(){
                                if(!isPiker()){
                                    tipdom.focus().val(tipdom.val());
                                }
                            },0)
                        }
                        tipdom.parent().addClass('has-error');
                    },
                    remove: function(){
                        tipdom.parent().removeClass('has-error');
                        tiptpl.css('display','none');
                    }
                };

                //此处根据判断来看是否是downWay还是aroundWay
                if (typeof($scope.tipway) != 'undefined') {
                    generValiInfoDownWay();
                }else{
                    hint.generator();
                }

                //错误信息的存储对象
                var error = ctrl.$error;
                //一步步验证错误信息
                $scope.valiByStep = function () {
                    var tipContent = "";
                    //第一步判断是否为空
                    if (error.required) {
                        tipContent = $scope.isSelect ? "请选择" + $scope.tipHead + "！" : $scope.tipHead + "不能为空！";
                        return tipContent.replace(' ', '');
                    }

                    //验证邮箱等格式
                    if (error.email) {
                        tipContent = "邮箱格式不正确！";
                        return tipContent;
                    }

                    //第二步判读是否符合自定义正则表达式，必须有ynValidation.content
                    if (error.pattern && $scope.ynValidation && $scope.ynValidation.content) {
                        if (0 == $scope.ynValidationContent.indexOf('@')) {
                            tipContent = $scope.ynValidation.content.slice(1);
                        } else {
                            tipContent = $scope.ynValidation.content;
                        }
                        return tipContent;
                    }

                    //第三步判断是否超过最大，或最小长度
                    if (error.maxlength || error.minlength) {
                        if ($attrs['ngMinlength'] && $attrs['ngMaxlength']) {
                            tipContent = $scope.ynValidationContent ? $scope.ynValidationContent : "只能输入" + $attrs['ngMinlength'] + "-" + $attrs['ngMaxlength'] + "个字！";
                            return tipContent;
                        }
                        if (error.maxlength) {
                            tipContent = $scope.ynValidationContent ? $scope.ynValidationContent : "只能输入1-" + $attrs['ngMaxlength'] + "个字！";
                            return tipContent;
                        }
                        //if(error.minlength){
                        //	tipContent = "只能输入大于"+$attrs['ngMinlength']+"个字符！";
                        //	return tipContent;
                        //}

                    }

                    //第四步，自定义逻辑判断
                    if (!$scope.custom.fun($scope)) {
                        if ((typeof $scope.custom.content) === "string") {
                            tipContent = $scope.custom.content;
                        } else {
                            tipContent = $scope.custom.content();
                        }
                        return tipContent;
                    }

                    if ($attrs.validation == 'required') {
                        if ($attrs.type == 'checkbox' || $attrs.type == 'radio') {
                            var chooseNums = $attrs.choose == undefined ? '1' : $attrs.choose;
                            tipContent = '请至少勾选' + chooseNums + '项！';
                            return tipContent;
                        }
                    }
                };

                //是否是选择标签
                $scope.isSelect = $element[0].localName == "select";

                //使用验证信息放在下方的验证方法
                var valiDownWay = function () {
                    //获得加hasError的html
                    var errorHtml = $scope.element.parent(".custom-validate");
                    if (!errorHtml || errorHtml.length == 0) {
                        if ($scope.inputGroup) {
                            errorHtml = $scope.element.parent("div");
                        }
                        errorHtml = $scope.element.closest("div");
                    }

                    var isCustomSuccess = $scope.custom.fun($scope);
                    if (ctrl.$invalid || !isCustomSuccess) {
//                        if($scope.inputGroup){
//                            errorHtml.addClass("has-error");
//                        }
                        errorHtml.addClass("has-error");
                        $scope.tipSpan.html($scope.valiByStep());
                        $scope.tipSpan.show();

                        //如果有强调信息，隐藏
                        if ($scope.emphasisInfo) {
                            $scope.emphasisInfo.hide();
                        }
                    } else {
//                        if($scope.inputGroup){
//                            errorHtml.removeClass("has-error");
//                        }
                        errorHtml.removeClass("has-error");
                        $scope.tipSpan.html('');
                        $scope.tipSpan.hide();

                        //如果有强调信息，显示
                        if ($scope.emphasisInfo) {
                            $scope.emphasisInfo.show();
                        }
                    }
                };

                $scope.checkAll = true;

                $scope.validate = function () {
                    $scope.clickWatchCount++;
                    //此处根据判断来看是否是downWay还是aroundWay
                    if (typeof($scope.tipway) != 'undefined') {
                        valiDownWay();
                    } else {
                        var isCustomSuccess = $scope.custom.fun($scope);
                        if ($attrs.type == 'checkbox' || $attrs.type == 'radio') {

                            var checkboxs = angular.element('[validat-group=' + $attrs.validatGroup + ']');
                            var checked = [];
                            angular.forEach(checkboxs, function (v) {
                                if (v.checked) {
                                    checked.push(v.checked);
                                }
                            });
                            var chooseNums = $attrs.choose == undefined ? '1' : $attrs.choose;
                            if (checked.length < chooseNums && $attrs.validation == 'required') {
                                //ctrl.$invalid = false;
                                isCustomSuccess = false;
                            } else {
                                //ctrl.$invalid = true;
                                isCustomSuccess = true;
                            }
                        }
                        //var tipwrap, tiptpl, tipdom;
                        //var isPiker = function(){
                        //    if($attrs.ynuiDatepicker != undefined || $attrs.ynuiTimepicker != undefined)
                        //        return true;
                        //};
                        //if ($scope.tipdom) {
                        //    tipdom = angular.element('#' + $scope.tipdom);
                        //} else if ($attrs.type == 'checkbox' || $attrs.type == 'radio') {
                        //    var checkboxs = angular.element('[validat-group=' + $attrs.validatGroup + ']');
                        //    tipdom = angular.element(checkboxs[0]).parent();
                        //} else {
                        //    tipdom = $element;
                        //}
                        //tipwrap = angular.element('<div class="gtooltip-wrap has-error"></div>');
                        //tiptpl = angular.element(
                        //    '<div class="gtooltip">' +
                        //    '<div class="tooltip-arrow"></div>' +
                        //    '<div class="tooltip-inner"></div>' +
                        //    '</div>');
                        //tipwrap.css({'height': tipdom.outerHeight(), 'display': tipdom.css('display')});
                        //tiptpl.addClass('top');
                        //if ($attrs.type == 'checkbox' || $attrs.type == 'radio') {
                        //
                        //    var checkboxs = angular.element('[validat-group=' + $attrs.validatGroup + ']');
                        //    var checked = [];
                        //    angular.forEach(checkboxs, function (v) {
                        //        if (v.checked) {
                        //            checked.push(v.checked);
                        //        }
                        //    });
                        //    var chooseNums = $attrs.choose == undefined ? '1' : $attrs.choose;
                        //    if (checked.length < chooseNums && $attrs.validation == 'required') {
                        //        //ctrl.$invalid = false;
                        //        isCustomSuccess = false;
                        //    } else {
                        //        //ctrl.$invalid = true;
                        //        isCustomSuccess = true;
                        //    }
                        //}
                        if (ctrl.$invalid || !isCustomSuccess) {
                            //tipdom.addClass('focus-true');
                            //if (!tipdom.parent().hasClass('gtooltip-wrap')) {
                            //    tipdom.wrap(tipwrap);
                            //    tiptpl.insertAfter(tipdom);
                            //    if (tipdom.parents('td').css('overflow') == 'hidden') {
                            //        tipdom.parents('td').css('overflow', 'visible');
                            //    }
                            //}
                            //tiptpl = tipdom.parent().find('.gtooltip');
                            //tiptpl.find('.tooltip-inner').html($scope.valiByStep());
                            //tiptpl.css({'position': 'fixed'});
                            //if (tiptpl.find('.tooltip-inner').css('width')) {
                            //    tiptpl.find('.tooltip-inner').css({'width': 'auto'});
                            //}
                            //tiptpl.appendTo(angular.element('body'));
                            //tiptpl.find('.tooltip-inner').css({'width': tiptpl.outerWidth() + 1});
                            //tiptpl.insertAfter(tipdom);
                            //tiptpl.css({'position': 'absolute'});
                            //var bottom, left;
                            //bottom = (tipdom.outerHeight() - 3);
                            //left = 0;
                            //tiptpl.css({'bottom': bottom, 'left': left});
                            //if ($scope.checkAll) {
                            //    if (angular.element('.focus-true').length > 0) {
                            //        angular.element('.focus-true')[0].focus();
                            //    }
                            //} else {
                            //    window.setTimeout(function(){
                            //        if(!isPiker()){
                            //            tipdom.focus().val(tipdom.val());
                            //        }
                            //    },0)
                            //}

                            hint.show();
                        } else {

                            hint.remove();

                            //if (tipdom.parent().hasClass('gtooltip-wrap')) {
                            //    tipdom.unwrap();
                            //    tipdom.siblings('.gtooltip').remove();
                            //    tipdom.removeClass('focus-true');
                            //    window.setTimeout(function(){
                            //        if(!isPiker()){
                            //            tipdom.focus().val(tipdom.val());
                            //        }
                            //    },0)
                            //}
                        }
                    }
                };

                //如果是select标签，绑定改变事件
                if ($scope.isSelect) {
                    $element.change(function () {
                        window.setTimeout(function () {
                            $scope.validate();
                        }, 10);
                    });
                }

                //需要观察ng-model的值,进行验证
                $scope.clickWatchCount = 0;
                if ($scope.isClick || $attrs.type == 'checkbox' || $attrs.type == 'radio') {
                    $scope.$watch(function () {
                        return ctrl.$modelValue
                    }, function () {
                        //加载页面,第一次时不判断
                        if ($scope.clickWatchCount > 0) {
                            $scope.checkAll = false;
                            $scope.validate();
                        }
                        if (ctrl.$modelValue != undefined) {
                            $scope.clickWatchCount++;
                        }
                    });
                }

                //为当前jq对象绑定keyup事件
                $element.bind('keyup', function () {
                    $scope.checkAll = false;
                    $scope.validate();
                });
                //2015-12-08 为当前jq对象绑定自定义时间，然后trigger触发，绑定keyup事件会触发别人自己绑定的keyup时间
                $element.bind('ynVali', function () {
                    $scope.validate();
                });


            }, 10);

        }
    };
});
