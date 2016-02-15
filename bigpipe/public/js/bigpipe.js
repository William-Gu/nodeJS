/**
 * Created by William_Koo on 1/27/16.
 */
var Bigpipe=function(){
    this.callbacks={};
}

Bigpipe.prototype.ready=function(key,callback){
    if(!this.callbacks[key]){
        this.callbacks[key]=[];
    }
    this.callbacks[key].push(callback);
}

Bigpipe.prototype.set=function(key,data){
    var callbacks=this.callbacks[key]||[];
    for(var i=0;i<callbacks.length;i++){
        callbacks[i].call(this,data);
    }
}