
/**
 * Module dependencies.
 */

var express = require('express');
var cradle = require('cradle');

var app = module.exports = express.createServer();
var conn = new(cradle.Connection)();
var db = conn.database('test');

// Configuration

app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "asdfghjkl" }));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.dynamicHelpers({ messages: require('express-messages') });

app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
	app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res) {
	var flash = req.flash();
	res.render('index', {
		title: 'Express',
		flashes: flash.error ? flash.error : null
	});
});

app.get('/items', function(req, res) {
	db.view('items/all', function(error, result) {
		// error handling
		if (error) {
			console.log(error);
			req.flash('error', 'Fetch failed: %s', error.reason);
			res.redirect('home');
			return;
		}

		res.render('items', {
			title: 'List database',
			items: result.toArray()
		});
	});
});

app.get('/edit/:id', function(req, res) {
	db.get(req.params.id, function(error, result) {
		// error handling
		if (error) {
			console.log(error);
			req.flash('error', 'Item %s does not exist', req.params.id);
			res.redirect('/items');
			return;
		}

		res.render('edit-form', {
			title: 'Edit item ' + result._id,
			item: result
		});
	});
});

app.post('/edit/:id', function(req, res) {
	db.get(req.params.id, function(error, result) {
		// error handling
		if (error) {
			console.log(error);
			req.flash('error', 'Item %s does not exist', req.params.id);
			res.redirect('/items');
			return;
		}

		var items = req.body;

		db.save(result._id, result._rev, {
			type: result.type,
			content: items.content
		}, function(error, result) {
			// error handling
			if (error) {
				console.log(error);
				req.flash('error', 'Database error: %s', error.reason);
				res.redirect('/edit/' + req.params.id);
				return;
			}

			req.flash('info', 'Successfully saved');
			res.redirect('/items');
		});
	});
});

app.listen(1337);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// vim:ts=4

