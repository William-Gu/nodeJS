var express = require('express');
var app=express();

app.use('/i',express.static('public/images'));
app.use('/c',express.static('public/css'))
app.use('/j',express.static('public/js'))


//各类路径匹配
app.get('/',function(req,res){
  res.send("Hello")
});
app.get('/ab?cd', function(req, res) {
  res.send('匹配 acd 和 abcd');
});
app.get('/ab+cd', function(req, res) {
  res.send('匹配 abcd、abbcd、abbbcd 等');
});
app.get('/ab*cd', function(req, res) {
  res.send('匹配 abcd、abxcd、abRABDOMcd、ab123cd 等');
});
app.get('/ab(cd)?e', function(req, res) {
  res.send('匹配 /abe 和 /abcde');
});

//正则
app.get(/.*fly$/, function(req, res) {
  res.send('匹配正则表达式：butterfly 和 dragonfly，但是不匹配 butterflyman、dragonfly man 等');
});

//回调函数
app.get('/example/b', function (req, res,next) {
  console.log('the response will be sent by the next function ...');
  next();
}, function (req, res) {
  res.send('Hello from B!');
});

//一组回调函数
var cb0 = function (req, res, next) {console.log('CB0');next();};
var cb1 = function (req, res, next) {console.log('CB1');next();};
var cb2 = function (req, res,next) {console.log('CB2');next()};
app.get('/example/c', [cb0, cb1, cb2]);

//一组回调函数+路由
app.get('/example/d', [cb0, cb1, cb2], function (req, res, next) {
  console.log('the response will be sent by the next function ...');
  next();
}, function (req, res) {
  res.send('Hello from D!');
});

//route命令第一个请求生效
app.route('/book/:name')
    .get(function(req, res) {
      console.log(req.params.name);
      res.send('Get a random book');
    })
    .post(function(req, res) {
      res.send('Add a book');
    })
    .put(function(req, res) {
      res.send('Update the book');
    });

//req.params可获取url参数
app.get('/user/:id/:user?', function(req, res){
  res.send('user:' + req.params.id+ req.params.user);
});

//获取方式1
var birds = require('./models/a.js');
app.use('/abc', birds);
//获取方式2
app.get('/viewdirectory', require('./models/mymiddleware.js'));


//内部url地址结合->/greet/jp
var greet = express.Router();
greet.get('/jp', function (req, res) {
    console.log(req.baseUrl);       //    /greet
    console.log(req.fresh);         //false     // no-cache
    console.log(req.hostname);      //localhost
    console.log(req.ip);            //::1
    console.log(req.originalUrl);   ///greet/jp
    console.log(req.ips);           //proxy setting
    console.log(req.path);          //     /jp
    console.log(req.query.name);    //name的参数
    console.log(req.route);         //上述的合集
    console.log(req.subdomains);    //子域名
    res.send('Konichiwa!');
});

app.use(['/gre+t', '/hel{2}o'], greet);

//错误处理函数有四个自变量而不是三个
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3000,function(){
});

