/**
 * Created by William_Koo on 1/21/16.
 */
var http=require("http");
var fs=require('fs');

function getTitles(req,res){
    if(req.url=="/"){
        fs.readFile("./data/template.json",function(err,data){
            if(err){
                //直接返回，避免多层if.else嵌套
                return Error(err,res);
            }
            getTemplate(data,res);
        })
    }
}
function getTemplate(data,res){
    var titles=JSON.parse(data.toString());
    var title=titles.title;
    fs.readFile("./views/template.html",function(err,data){
        if(err){
            return Error(err,res)
        }
        var temp=data.toString();
        var html=temp.replace("%",title.join('</li><li>'));
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(html);
    })
}
function Error(err,res){
    console.log(":"+err);
    res.end(':Server Error.');
}

var server=http.createServer(function(req,res){
    getTitles(req,res);
}).listen(8081);