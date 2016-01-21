var express = require('express');
var app=express();


//读取外部文件
var fs=require("fs");
fs.readFile('./bin/data.json',function(err,data){
    console.log("data"+data)
});

var stream=fs.createReadStream('./bin/data.json')
stream.on('data',function(chunk){
   // var chunk = chunk.toString();
    console.log(chunk)
});
stream.on('end',function(){
    console.log('finished.')
});

//获取外部模块
var num=require('./models/num');
app.get('/a',function(req,res){
    res.send("ss")
});



app.listen(3000,function(){
});

