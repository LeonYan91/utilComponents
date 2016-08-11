angular.module("yn.utils").service("ynNotification",["$sce","ynModal",function($sce,ynModal){
	var ynNotification = {
			/**
			 * type:用于指定弹出框类型和控制图标样式,有三个值:warinng,error,sucess
			 * hint:弹出框的内容提要部分
			 * message:弹出框的内容详细部分
			 * okCallBack:点击确定按钮之后的回调
			 */
		confirm:function(type,hint,message,okCallBack,onCancelBack,onCloseFun){
			toastr.clear();
			var tmplPath = basePath + "/scripts/components/9-ynNotification/template/ynNotification.html";
                //D:\SVN\00-code\yn-corpSysLand\branches\0.1.0\src\main\webapp\scripts\components\9-ynNotification\template\ynNotification.html
                //basePath + '/scripts/components/21-ynuiDataGrid/template/ynuiDataGrid.html',
                //    "/scripts/components/9-ynNotification/template/ynNotification.html"

			if(!okCallBack){
				okCallBack = function(){}
			}
            if(!onCancelBack){
                onCancelBack = function(){}
            }
            if(!onCloseFun){
                onCloseFun = function(){}
            }

			var confirmConfig = {
				title:"提示",
				button:[{
					value: '确定',
					autofocus: true,
					callback: okCallBack
				}, {
					value: '取消',
					callback: onCancelBack
				}],
                onclose:onCloseFun
			}

			message = $sce.trustAsHtml(message);
			ynModal.showModal(tmplPath,confirmConfig,{type:type,hint:hint,message:message});
		},
		/**
		 * type:用于指定弹出框类型和控制图标样式,有三个值:warinng,error,sucess
		 * hint:弹出框的内容提要部分
		 * message:弹出框的内容详细部分
		 * okCallBack:点击确定按钮之后的回调
		 */
		alert:function(type,hint,message,okCallBack,cancelCallBack,onCloseFun,options){
			toastr.clear();
			var tmplPath = basePath + "/scripts/components/9-ynNotification/template/ynNotification.html";

            var okCb = okCallBack || angular.noop;
            var celCb = cancelCallBack || angular.noop;
            var closeF = onCloseFun || angular.noop;
            var options = options || {};


			var confirmConfig = {
				title:options.title?options.title:"提示",
				button:[{
					value: options.okValue?options.okValue:'确定',
					autofocus: true,
					callback: okCb
				}],
                onclose:closeF
			}
            if(cancelCallBack){
                var confirmConfig = {
                    title:options.title?options.title:"提示",
                    button:[{
                        value: options.okValue?options.okValue:'确定',
                        autofocus: true,
                        callback: okCb
                    },{
                        value:options.celValue?options.celValue:'取消',
                        callback: celCb
                    }],
                    onclose:closeF
                }
            }

			message = $sce.trustAsHtml(message);
			ynModal.showModal(tmplPath,confirmConfig,{type:type,hint:hint,message:message});
		},
		/**
		 * type:用于指定弹出框类型和控制图标样式,有三个值:info,error,sucess
		 * message:提示框的内容部分
		 */
		notify:function(type,message){
			var loadingOptions = {
				"positionClass": "toast-top-center",
				"iconClasses": {
					info: 'toast-loading'
				}
			};
			var tipOptions = {
					"positionClass": "toast-top-center"
				};
			if(type){
				toastr.remove();
				if(type=="info"){
					//toastr.options = loadingOptions;
					//toastr.info(message);
				}
                //(20160616 add by yanliang 有人把info注释了，怕影响其他的，在这里再加个类型，其实和type为info等同)
                if(type=="loading"){
                    toastr.options = loadingOptions;
                    toastr.info(message);
                }
				if(type=="success"){
					toastr.options = tipOptions;
					toastr.success(message);
				}
				if(type=="error"){
					toastr.options = tipOptions;
					toastr.error(message);
				}
			}
		},
		notifyClear:function(){
			toastr.clear();
		}

	};
	return ynNotification;
}]);
