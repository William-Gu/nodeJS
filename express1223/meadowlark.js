var http = require('http'),
	express = require('express'),
	fortune = require('./lib/fortune.js'),
	formidable = require('formidable'),
	favicon = require('serve-favicon'),
	fs = require('fs'),
	credentials = require('./credentials.js'),
	requiresWaiver = require('./lib/requiresWaiver.js'),
	cartValidation=require('./lib/cartValidation.js');

//var emailService = require('./lib/email.js')(credentials);
//emailService.send('gujun@liba.com','Hood river tours on sale today!','Get \`em while they\`re hot!')
var app = express();


app.use(favicon(__dirname + '/public/favicon.ico'));

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});

switch(app.get('env')){
	case 'development':
		// compact, colorful dev logging
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		// module 'express-logger' supports daily log rotation
		app.use(require('express-logger')({ path: __dirname + '/log/requests.log'}));
		break;
};

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

app.use(function(req, res, next){
	var domain = require('domain').create();
	domain.on('error', function(err){
		console.error('DOMAIN ERROR CAUGHT\n', err.stack);
		try {
			setTimeout(function(){
				console.error('Failsafe shutdown.');
				process.exit(1);
			}, 5000);
			var worker = require('cluster').worker;
			if(worker) worker.disconnect();
			server.close();

			try {
				next(err);
			} catch(error){
				console.error('Express error mechanism failed.\n', error.stack);
				res.statusCode = 500;
				res.setHeader('content-type', 'text/plain');
				res.end('Server error.');
			}
		} catch(error){
			console.error('Unable to send 500 response.\n', error.stack);
		}
	});
	domain.add(req);
	domain.add(res);
	domain.run(next);
});

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));

app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());

// flash message middleware
app.use(function(req, res, next){
	// if there's a flash message, transfer
	// it to the context, then clear it
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

// set 'showTests' context property if the querystring contains test=1
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' &&
		req.query.test === '1';
	next();
});

app.use(requiresWaiver);
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

// mocked weather data
function getWeatherData(){
    return {
        locations: [
            {	name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
			},{	name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },{	name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}

// middleware to add weather data to context
app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
 	res.locals.partials.weatherContext = getWeatherData();
 	next();
});
app.get('/', function(req, res) {
	res.render('home');
	res.cookie('name','william',{signed:true,maxAge:1000000,httpOnly:true});
	res.cookie('age','18',{signed:true});
});
app.get('/about', function(req,res){
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	} );
});
app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});
app.get('/tours/oregon-coast', function(req, res){
	res.render('tours/oregon-coast');
});
app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});
app.get('/jquery-test', function(req, res){
	res.render('jquery-test');
});
app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});
app.get('/thank-you', function(req, res){
	res.render('thank-you');
});
app.get('/newsletter', function(req, res){
	res.render('newsletter');
});

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){}
NewsletterSignup.prototype.save = function(cb){cb();};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
app.post('/newsletter', function(req, res){
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) {
		if(req.xhr) return res.json({ error: 'Invalid name email address.' });
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you en<p>tered was  not valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}
	new NewsletterSignup({ name: name, email: email }).save(function(err){
		if(err) {
			if(req.xhr) return res.json({ error: 'Database error.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true });
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	});
});
app.get('/newsletter/archive', function(req, res){
	res.render('newsletter/archive');
});
app.get('/contest/vacation-photo', function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', { year: now.getFullYear(), month: now.getMonth() });
});
// make sure data directory exists
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if(!fs.existsSync(vacationPhotoDir)) fs.mkdirSync(vacationPhotoDir);
function saveContestEntry(contestName, email, year, month, photoPath){
	// TODO...this will come later
}
app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) return res.redirect(303, '/error');
		if(err) {
			res.session.flash = {
				type: 'danger',
				intro: 'Oops!',
				message: 'There was an error processing your submission. ' +
				'Pelase try again.',
			};
			return res.redirect(303, '/contest/vacation-photo');
		}
		var photo = files.photo;
		var dir = vacationPhotoDir + '/' + Date.now();
		var path = dir + '/' + photo.name;
		fs.mkdirSync(dir);

		fs.renameSync(photo.path, dir + '/' + photo.name);
		saveContestEntry('vacation-photo', fields.email,
			req.params.year, req.params.month, path);
		req.session.flash = {
			type: 'success',
			intro: 'Good luck!',
			message: 'You have been entered into the contest.',
		};
		return res.redirect(303, '/contest/vacation-photo/entries');
	});
});
//app.post('/contest/vacation-photo/:year/:month', function(req, res){
//    var form = new formidable.IncomingForm();
//    form.parse(req, function(err, fields, files){
//        if(err) return res.redirect(303, '/error');
//        console.log('received fields:');
//        console.log(fields);
//        console.log('received files:');
//        console.log(files);
//        res.redirect(303, '/thank-you');
//    });
//});
app.post('/cart/checkout',function(req,res){
	var cart=req.session.cart;
	if(!cart){next(new Error('Cart does not exist.'))}
	var name=req.body.name||'',emial=req.body.email||""
	if(!email.match(VALID_EMAIL_REGEX)){
		return  req.next(new Error('Invalid email address.'))
	}
	cart.number=Math.random().toString().replace(/^0\.0*/,'')
	cart.billing={
		name:name,
		email:email
	}
	res.render('email/cart-thank-you',{layout:null,cart:cart},function(err,html){
		if(err){console.log('error in email temlate')}
		mailTransport.sendMail({
			from:'"william":gujun@liba.com',
			to:cart.billing.email,
			subject:'Thank you for Book your trip with me.',
			html:html,
			generateTextFromHtml:true
		},function(err){
			if(err){console.error('Unable to send confirmation:'+err.stack)}
		})
	})
	res.render('cart-thank-you',{cart:cart})
})

app.get('/fail',function(req,res){
	throw new Error('Nope!');
});

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
	res.status(404).render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).render('500');
});

//app.listen(app.get('port'), function(){
//  console.log( 'Express started on http://localhost:' +
//    app.get('port') + '; press Ctrl-C to terminate.' );
//});

function startServer() {
	server = http.createServer(app).listen(app.get('port'), function(){
		console.log(
			'Express started in '+app.get('env')+
			' mode on http://localhost:'+ app.get('port')+
			'; press Ctrl-C to terminate.'
		);
	});
}
if(require.main === module){
	// application run directly; start app server
	startServer();
} else {
	// application imported as a module via "require": export function to create server
	module.exports = startServer;
}
