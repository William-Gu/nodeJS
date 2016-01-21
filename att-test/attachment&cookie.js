var express = require('express');
var app=express();

app.use('/i',express.static('public/images'));
app.use('/c',express.static('public/css'))
app.use('/j',express.static('public/js'))


//附件下载
app.get('/attachment/:name',function(req,res){
    res.attachment();
    res.attachment('path/to/'+req.params.name);
    res.send("down");
});
app.get('/download',function(req,res){
    res.download('public/images/background.png','b.png');
  //  res.send("down");
});


//cookie
app.get('/',function(req,res){
    res.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
    res.cookie('cart', { items: [1,2,3] });
    res.cookie('name', 'tobi', {
        domain: 'localhost',
        path: '/admin',
        secure: false ,//https
        expires: new Date(Date.now() + 900000),
        maxAge:100000,
        //httpOnly: true
    });
    res.send("ok");
});




app.listen(3000,function(){
});

