/**
 * Created by William_Koo on 1/27/16.
 */
var express = require('express');
var path = require('path');
var http = require('http');
var ejs = require('ejs');
var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.get('/index.html', function (req, res) {
    res.render('index', { title: "测试" }, function (err, str) {
        res.write(str)
    })
    var Pagelets_list ={
        pagelet1:false,
        pagelet2:false
    }
    var data = {is: "true"};
    function is_end(Pagelets) {
        Pagelets_list[Pagelets]=true;
        for (x in Pagelets_list) {
            if(!Pagelets_list[x]){
                return;
            }
        }
        res.end();
        return;
    }

    function Pagelets(Pagelets) {
        res.write('<script>bigpipe.set("' + Pagelets + '",' + JSON.stringify(data) + ');</script>');
        is_end(Pagelets)
    }
    setTimeout(function(){Pagelets("pagelet1");},1000);
    setTimeout(function(){Pagelets("pagelet2");},3000);
});

http.createServer(app).listen(3000);