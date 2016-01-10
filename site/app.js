var express = require('express'),
	config = require('./config'),
	helpers = require('./helpers'),
	bodyParser = require('body-parser'),
	app = express(),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	needle = require('needle'),
	swig = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/views/static'));
app.use(cookieParser());
app.use(session({secret: 'anything', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view cache', false);
swig.setDefaults({cache: false});



app.locals = {

};
/* gets */
app.get('*', function(req, res, next) {
	next();
});
app.get('/', helpers.checkAuth, function(req, res) {
	if(!helpers.empty(req.query)) {
		if(req.query.sender || req.query.message) {
			helpers.GetActiveChatters(function(chatters) {
				helpers.GetUserLog(req.query).then(function(dbres) {
					res.render('index', {data: dbres, chatters: chatters, alert: "Query Results"});
				});
			});
		} else {
			res.render('index', {err: "empty"});
		}
	} else {
		helpers.GetActiveChatters(function(chatters) {
			helpers.GetLatestMessages().then(function(dbres) {
				res.render('index', {data: dbres, chatters: chatters, alert: "showing latest messages (this will be realtime someday)"});
			});
		});
	}
});
app.get('/auth', function(req, res) {
	needle.post('https://api.twitch.tv/kraken/oauth2/token', {
		client_id: config.twitchcid,
		client_secret: config.twitchsecret,
		grant_type: 'authorization_code',
		redirect_uri: config.baseurl + '/auth/',
		code: req.query.code
	}, function(err, resp, body) {
		if(!err) {
			needle.get('https://api.twitch.tv/kraken/user?oauth_token=' + body.access_token, function(error, data) {
				if(!error && data.statusCode == 200) {
					req.session.auth = body.access_token;
					req.session.name = data.body.name;
					res.redirect('/');
				}else{
					res.status(404).send('Unable to Authenticate.');
				}
			});
		}else{
			res.status(404).send('OAuth API is being a butt.');
		}
	});
});

app.get('*', function(req, res, next) {
	res.render('404');
});

var server = app.listen(8080, function() {
	console.log('listening on:' + 8080);
});
