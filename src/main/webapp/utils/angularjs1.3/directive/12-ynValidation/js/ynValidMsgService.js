/**
 * Created by YanLiang on 2015/5/11.
 * 提示信息封装，所有的提示信息都应从这里去，便于维护，管理
 */

ynUtilsApp.factory('ynValidMsgService',function(){
    //为空判断提示信息
    var reqChoice = "请选择";
    var reqNull = "不能为空";

    //单个，批量删除时的提示和警告信息
    var delMsg = "你确认要删除所选吗？";//单个和批量删除时的提示信息
    var delWarn = "删除后无法恢复。";//单个和批量删除时的警告信息

    //CRUD ,操作后提示
    //成功
    var addSuccess = "添加成功";
    var delSuccess = "删除成功";
    var modSuccess = "修改成功";
    var queSuccess = "查询成功";
    //失败
    var addError = "添加失败";
    var delError = "删除失败";
    var modError = "修改成功";
    var queError = "查询失败";

    //操作成功和失败，目前CRUD都使用“操作XX！”来提示
    var opeSuccess = "操作成功";
    var opeError = "操作失败";

    //批量操作
    var mulDelAllSuccess = "全部删除成功";
    var mulDelPartSuccess = "部分删除成功";
    var mulDelAllError = "全部删除失败";

    //邮箱，手机号，身份证格式验证信息
    var emailError = "邮箱格式不正确！";//邮箱格式不正确

    //多选时的提示
    var multiChoiceWarn = "请至少勾选一项！";

    //时间大小比较
    var endError = "结束日期必须大于等于开始日期！";
    var startError = "开始日期必须小于等于结束日期！";

    //上一条，下一条
    var preItem = "上一条";
    var nexItem = "下一条";
    var firItem = "已经是第一条！";
    var lasItem = "已经是最后一条！";



    //所有的提示函数
    return {
        ///////////////为空判断//////////////////////
        getReqChoiceMsg:function(msg){
            return reqChoice+msg+"！";
        },
        getReqNullMsg:function(msg){
            return msg+reqNull+"！";
        },

        //删除，提示信息
        getDelMsg:function(){
            return delMsg;
        },
        //删除，警告信息
        getWarnMsg:function(){
            return delWarn;
        },

        /////////////////CRUD成功///////////////////////////
        //添加成功，目前CRUD都写成‘操作成功’
        getAddSuccessMsg:function(){
            return opeSuccess+"！";
        },
        //删除成功，目前CRUD都写成‘操作成功’
        getDelSuccessMsg:function(){
            return opeSuccess+"！";
        },
        //修改成功，目前CRUD都写成‘操作成功’
        getModSuccessMsg:function(){
            return opeSuccess+"！";
        },
        //查询成功，目前CRUD都写成‘操作成功’
        getQueSuccessMsg:function(){
            return opeSuccess+"！";
        },


        /////////////////CRUD失败////////////////////////
        //添加失败，目前CRUD都写成‘操作失败’
        // msg 可传入具体提示信息，exist 提示为XX已存在，可以传入提示什么不存在
        getAddErrorMsg:function(msg,exist){
            return exist ? opeError+","+exist+"已存在！" : (msg ? opeError+","+msg+"！" : opeError+"！");
        },
        //删除失败，目前CRUD都写成‘操作失败’
        getDelErrorMsg:function(msg){
            return msg ? opeError+","+msg+"！" : opeError+"！";
        },
        //修改失败，目前CRUD都写成‘操作失败’
        getModErrorMsg:function(msg){
            return msg ? opeError+","+msg+"！" : opeError+"！";
        },
        //查询失败，目前CRUD都写成‘操作失败’
        getQueErrorMsg:function(msg){
            return msg ? opeError+","+msg+"！" : opeError+"！";;
        },

        /////////////////操作成功，失败////////////////////////
        getOpeSuccessMsg:function(){
            return opeSuccess+"!";
        },
        getOpeErrorMsg:function(){
            return opeError+"!";
        },

        /////////////////全部删除///////////////////////////////////
        //全部删除成功
        getMulDelAllSuccessMsg:function(){
            return mulDelAllSuccess;
        },
        //部分删除成功
        getMulDelPartSuccessMsg:function(){
            return mulDelPartSuccess;
        },
        //全部删除失败
        getMulDelAllError:function(){
            return mulDelAllError;
        },
        //部分删除成功时的具体描述信息,msg需要显示的具体删除信息失败的描述
        getMulDelErrorDescription:function(msg){
            var s = "<li>您所选择的数据中有" + msg.length + "条删除失败，原因如下：</li>";
            for(var i=0;i<msg.length;i++){
                s += '<li>' + (i+1) + '、' + msg[i] + '</li>';
            }
            var message = '<ul class="list-unstyled">' + s + '</ul>';

            return message
        },


        //////////////邮箱，手机号，身份证格式验证信息//////////////////
        getEmailErrorMsg:function(){
            return emailError;
        },

        //////////////至少勾选一项//////////////////
        getMultiChoiceWarn:function(){
            return multiChoiceWarn;
        },

        /////////////////日期比较////////////////////////
        //点击结束日期，小于了开始日期
        getEndError:function(msg){
            return msg ? msg + endError : endError;
        },
        //点击开始日期，大于了结束日期
        getStartError:function(msg){
            return msg ? msg + startError : startError;
        },

        /////////////////上一条，下一条////////////////////////
        getPreItemMsg:function(){
            return preItem;
        },
        getNexItemMsg:function(){
            return nexItem;
        },
        getFirItemMsg:function(){
            return firItem;
        },
        getLasItemMsg:function(){
            return lasItem;
        }



    };
});