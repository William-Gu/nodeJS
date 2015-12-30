/**
 * Created by William_Koo on 15/12/30.
 */
var connect=require('C:/Users/node_modules/connect');//connect中间件的路径
var http=require('http');
var favicon=require('C:/Users/node_modules/serve-favicon');//serve-favicon中间件的路径
var app=connect()
    .use(favicon(__dirname + '/public/favicon.ico'))//__dirname代表该执行文件的父目录，注意是双下划线，否则会爆出错误
    .use(function(req,res){
        res.end('hello world\n');
    });
http.createServer(app).listen(8124);