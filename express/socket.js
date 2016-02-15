/**
 * Created by William_Koo on 1/21/16.
 */
var net=require('net');
var server=net.createServer(function(socket){
    socket.on('data',function(data){
        socket.write(data)
    })
});
server.listen(8888);

//var EventEmitter=require('events').EventEmitter;
//var channel=new EventEmitter();
//channel.on('join',function(){
//    console.log('Welcome');
//});
//channel.emit('join');