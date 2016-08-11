angular.module("yn.utils").directive("ynForm",function(){
	return{
	    restrict:'A',//只能作为属性使用
	    require:"form",
	    link:function($scope,$element,$attrs,formController){
	 	   	var children = $element.find("[yn-validation]");
	     	   	$scope.$watch(function(){
		     		return formController.$submitted;
		     	},function(newVal){
		     		if(newVal==true){
		     			angular.forEach(children,function(child){
		     				$(child).keyup();
			   	     	});
		     		}
		     	});
	        }
	}
});