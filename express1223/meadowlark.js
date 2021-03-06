var http = require('http'),
	express = require('express'),
	fortune = require('./lib/fortune.js'),
	formidable = require('formidable'),
	favicon = require('serve-favicon'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	Vacation = require('./models/vacation.js'),
	VacationInSeasonListener = require('./models/vacationInSeasonListener.js'),
	Attraction=require('./models/attraction.js'),
	credentials = require('./credentials.js'),
	cartValidation=require('./lib/cartValidation.js'),
	static=require('./lib/static.js');

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
        },
		//{{static '/img/logo.png'}}
		static:function(name){
			return static.map(name);
		}
    }
});

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
switch(app.get('env')){
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, options);
		break;
	case 'production':
		mongoose.connect(credentials.mongo.production.connectionString, options);
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
}

app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());
app.use(require('express-session')({
	saveUninitialized: false,
	secret: credentials.cookieSecret,
}));

//{{logoImage}}
app.use(function(req, res, next){
	var now = new Date();
	res.locals.logoImage = now.getMonth()==0 && now.getDate()==7 ?
		static.map('/img/logo_bud_clark.png') :
		static.map('/img/logo.png');
	next();
});

var options = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
};


// initialize vacations
Vacation.find(function(err, vacations){
	if(vacations.length) return;
	new Vacation({
		name: 'Hood River Day Trip',
		slug: 'hood-river-day-trip',
		category: 'Day Trip',
		sku: 'HR199',
		description: 'Spend a day sailing on the Columbia and ' +
		'enjoying craft beers in Hood River!',
		priceInCents: 9995,
		tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
		inSeason: true,
		maximumGuests: 16,
		available: true,
		packagesSold: 0,
	}).save();

	new Vacation({
		name: 'Oregon Coast Getaway',
		slug: 'oregon-coast-getaway',
		category: 'Weekend Getaway',
		sku: 'OC39',
		description: 'Enjoy the ocean air and quaint coastal towns!',
		priceInCents: 269995,
		tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
		inSeason: false,
		maximumGuests: 8,
		available: true,
		packagesSold: 0,
	}).save();

	new Vacation({
		name: 'Rock Climbing in Bend',
		slug: 'rock-climbing-in-bend',
		category: 'Adventure',
		sku: 'B99',
		description: 'Experience the thrill of rock climbing in the high desert.',
		priceInCents: 289995,
		tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
		inSeason: true,
		requiresWaiver: true,
		maximumGuests: 4,
		available: false,
		packagesSold: 0,
		notes: 'The tour guide is currently recovering from a skiing accident.',
	}).save();
});

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

// create "admin" subdomain...this should appear
// before all your other routes
var admin = express.Router();
app.use(require('vhost')('admin.*', admin));


// create admin routes; these can be defined anywhere
admin.get('/', function(req, res){
	res.render('admin/home');
});
admin.get('/users', function(req, res){
	res.render('admin/users');
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


app.get('/vacation/:vacation', function(req, res, next){
	Vacation.findOne({ slug: req.params.vacation }, function(err, vacation){
		if(err) return next(err);
		if(!vacation) return next();
		res.render('vacation', { vacation: vacation });
	});
});

function convertFromUSD(value, currency){
	switch(currency){
		case 'USD': return value * 1;
		case 'GBP': return value * 0.6;
		case 'BTC': return value * 0.0023707918444761;
		default: return NaN;
	}
}
//app.use(cartValidation.checkWaivers);
//app.use(cartValidation.checkGuestCounts);

app.get('/vacations', function(req, res){
	Vacation.find({ available: true }, function(err, vacations){
		var currency = req.session.currency || 'USD';
		var context = {
			currency: currency,
			vacations: vacations.map(function(vacation){
				return {
					sku: vacation.sku,
					name: vacation.name,
					description: vacation.description,
					inSeason: vacation.inSeason,
					price: convertFromUSD(vacation.priceInCents/100, currency),
					qty: vacation.qty,
				};
			})
		};
		switch(currency){
			case 'USD': context.currencyUSD = 'selected'; break;
			case 'GBP': context.currencyGBP = 'selected'; break;
			case 'BTC': context.currencyBTC = 'selected'; break;
		}
		res.render('vacations', context);
	});
});



app.post('/vacations', function(req, res){
	Vacation.findOne({ sku: req.body.purchaseSku }, function(err, vacation){
		if(err || !vacation) {
			req.session.flash = {
				type: 'warning',
				intro: 'Ooops!',
				message: 'Something went wrong with your reservation; ' +
				'please <a href="/contact">contact us</a>.',
			};
			return res.redirect(303, '/vacations');
		}
		vacation.packagesSold++;
		vacation.save();
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'Your vacation has been booked.',
		};
		res.redirect(303, '/vacations');
	});
});


app.get('/cart/add', function(req, res, next){
	var cart = req.session.cart || (req.session.cart = { items: [] });
	Vacation.findOne({ sku: req.query.sku }, function(err, vacation){
		if(err) return next(err);
		if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.query.sku));
		cart.items.push({
			vacation: vacation,
			guests: req.body.guests || 1,
		});
		res.redirect(303, '/cart');
	});
});
app.post('/cart/add', function(req, res, next){
	var cart = req.session.cart || (req.session.cart = { items: [] });
	Vacation.findOne({ sku: req.body.sku }, function(err, vacation){
		if(err) return next(err);
		if(!vacation) return next(new Error('Unknown vacation SKU: ' + req.body.sku));
		cart.items.push({
			vacation: vacation,
			guests: req.body.guests || 1,
		});
		res.redirect(303, '/cart');
	});
});
app.get('/cart', function(req,res,next){
	var cart = req.session.cart;
	cart.some=function(){console.log("ss")}
	console.log(cart)
	if(!cart) next();
	res.render('cart', { cart: cart });
	//res.render('cart');
});
app.get('/cart/checkout', function(req, res, next){
	var cart = req.session.cart;
	if(!cart) next();
	res.render('cart-checkout');
});
app.get('/cart/thank-you', function(req, res){
	res.render('cart-thank-you', { cart: req.session.cart });
});
app.get('/email/cart/thank-you', function(req, res){
	res.render('email/cart-thank-you', { cart: req.session.cart, layout: null });
});
app.post('/cart/checkout', function(req, res){
	var cart = req.session.cart;
	if(!cart) next(new Error('Cart does not exist.'));
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) return res.next(new Error('Invalid email address.'));
	// assign a random cart ID; normally we would use a database ID here
	cart.number = Math.random().toString().replace(/^0\.0*/, '');
	cart.billing = {
		name: name,
		email: email,
	};
	res.render('email/cart-thank-you',
		{ layout: null, cart: cart }, function(err,html){
			if( err ) console.log('error in email template');
			emailService.send(cart.billing.email,
				'Thank you for booking your trip with Meadowlark Travel!',
				html);
		}
	);
	res.render('cart-thank-you', { cart: cart });
});

app.get('/notify-me-when-in-season', function(req, res){
	res.render('notify-me-when-in-season', { sku: req.query.sku });
});

app.post('/notify-me-when-in-season', function(req, res){
	VacationInSeasonListener.update(
		{ email: req.body.email },
		{ $push: { skus: req.body.sku } },
		{ upsert: true },
		function(err){
			if(err) {
				console.error(err.stack);
				req.session.flash = {
					type: 'danger',
					intro: 'Ooops!',
					message: 'There was an error processing your request.',
				};
				return res.redirect(303, '/vacations');
			}
			req.session.flash = {
				type: 'success',
				intro: 'Thank you!',
				message: 'You will be notified when this vacation is in season.',
			};
			return res.redirect(303, '/vacations');
		}
	);
});

app.get('/set-currency/:currency', function(req,res){
	req.session.currency = req.params.currency;
	return res.redirect(303, '/vacations');
});


var rest = require('connect-rest');

rest.get('/attractions', function(req, content, cb){
	Attraction.find({ approved: true }, function(err, attractions){
		if(err) return cb({ error: 'Internal error.' });
		cb(null, attractions.map(function(a){
			return {
				name: a.name,
				description: a.description,
				location: a.location,
			};
		}));
	});
});

rest.post('/attraction', function(req, content, cb){
	var a = new Attraction({
		name: req.body.name,
		description: req.body.description,
		location: { lat: req.body.lat, lng: req.body.lng },
		history: {
			event: 'created',
			email: req.body.email,
			date: new Date(),
		},
		approved: false,
	});
	a.save(function(err, a){
		if(err) return cb({ error: 'Unable to add attraction.' });
		cb(null, { id: a._id });
	});
});

rest.get('/attraction/:id', function(req, content, cb){
	Attraction.findById(req.params.id, function(err, a){
		if(err) return cb({ error: 'Unable to retrieve attraction.' });
		cb(null, {
			name: a.name,
			description: a.description,
			location: a.location,
		});
	});
});

// API configuration
var apiOptions = {
	context: '/',
	domain: require('domain').create(),
};
app.use(vhost('api.*',rest.rester(apiOptions)));

apiOptions.domain.on('error', function(err){
	console.log('API domain error.\n', err.stack);
	setTimeout(function(){
		console.log('Server shutting down after API domain error.');
		process.exit(1);
	}, 5000);
	server.close();
	var worker = require('cluster').worker;
	if(worker) worker.disconnect();
});


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
