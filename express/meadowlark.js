var express = require('express');
var app = express();

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));

var fortuneCookies = [
	"Conquer your fears or they will conquer you.",
	"Rivers need springs.",
	"Do not fear what you don't know.",
	"You will have a pleasant surprise.",
	"Whenever possible, keep it simple.",
];

//该页面输出字符（非结合）
app.get('/abc', function(req, res) {
	res.send('abc');
});
app.locals.title = 'My App';
//默认页为home页（结合）
app.get('/', function(req, res) {
	res.render('home');
});
app.get('/my', function(req, res) {
	res.render('my');
});
app.get('/about', function(req,res){
	var randomFortune =
		fortuneCookies[Math.floor(Math.random() * fortuneCookies.length)];
	res.render('about', { fortune: randomFortune });
});

app.get('/flow', function(req, res) {
	res.sendFile('/Users/William_Koo/Documents/nodeJS/express/public/flow.html');
});

//app.use('/public',express.static('public'));
app.use('/img',express.static('public/images'));
app.use('/img1',express.static('public/images1'));


// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404).render('404');
});
// 500 error handler (middleware)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' + 
    app.get('port') + '; press Ctrl-C to terminate.' );
});
