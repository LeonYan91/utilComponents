angular.module("ynNotificationApp").controller("ynNotificationController",["$scope","ynNotification",function($scope,ynNotification){

	$scope.confirm = function(){
		var hint ="你所拨打的电话是空号!";
		var message = '<ul class="list-unstyled "><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li></ul>';
		var okCallBack =function(){
			console.log("okCallBack");
			return false;
		};
		ynNotification.confirm("error",hint,message,okCallBack);
	},
	$scope.alertSuccess = function(){
		var hint ="你所拨打的电话是空号!";
		var message = '<ul class="list-unstyled "><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li></ul>';
		var okCallBack =function(){
			console.log("okCallBack success");
			return true;
		};
		ynNotification.alert("success",hint,message,okCallBack);
	},
	$scope.alertError = function(){
		var hint ="你所拨打的电话是空号!";
		var message = '<ul class="list-unstyled "><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li><li>1、xx下有yy，不能删除</li></ul>';
		var okCallBack =function(){
			return true;
		};
		ynNotification.alert("error",hint,message,okCallBack);
	},
	$scope.notifySchedule = function(){
		ynNotification.notify("info",'以下2种均为此提示方式：<br>正在提交...<br>正在加载...');
	},
	$scope.notifySuccess = function(){
		ynNotification.notify("success",'以下4种均为此提示方式：<br>添加成功！修改成功！<br>删除成功！操作成功！');
	},
	$scope.notifyFail = function(){
		ynNotification.notify("error",'以下3种均为此提示方式：<br>系统繁忙，请稍后重试！<br>请求服务器失败，请联系管理员！<br>请至少勾选一项！');
	}

}]);
