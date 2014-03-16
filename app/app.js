#!/usr/bin/env node

var express = require('express');
var http = require('http')
var path = require('path');
var chromecast = require('chromecast')();
var utils = require('./utils');
var config = require('./config');
var socketio = require('socket.io');
var url = require('url');

// parsing some data from the receiver url:
var receiverUrl = url.parse(config.chromecastApp.receiverurl);

var serverAddress = '';

var app = express();

app.configure(function(){
	app.set('port', receiverUrl.port?receiverUrl.port:80); // run express webserver on the port specified by the receiver url
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('casturl654646416843161'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

// Webserver:
if( app.get('port') < 1024 )
	console.log("> IMPORTANT: You're trying to run this webserver on port " + app.get('port') + ", if you're on Mac OS X/Linux, make sure you're using 'sudo node app' to run this app.");

var server = http.createServer(app).listen(app.get('port'), function (){
	console.log("> Webserver listening on port " + app.get('port'));

	// Find Chromecast:
	findChromecastAndRunApp(config.chromecastApp, function (err) {
		if(err) return console.log(err);
	});
});

// Socket IO
var io = socketio.listen(server);
io.set('log level', 0);

// using the path extracted from the receiver-url in the config.js file so you don't have to do this manually
app.get(receiverUrl.path, function (req, res){
	console.log('> Chromecast connected');

	res.render('receiver', {
		title: config.chromecastApp.title
	});

	serverAddress = req.protocol + "://" + req.get('host');

	console.log("> Go to " + serverAddress + '/openurl?url=some url to open a url on the Chromecast');

	console.log('> Go to http://' + req.connection.remoteAddress + ':9222 to debug the Chromecast');
});

function findChromecastAndRunApp (app, callback) {
	console.log("> Looking for Chromecast...");

	chromecast.on('device', function (device){
		var deviceName = device.name.replace(/&apos;/, "'");
		if(config.chromecastName && config.chromecastName != '' && config.chromecastName != deviceName) return;

		console.log("> Found Chromecast: " + deviceName );
		console.log("> Launching app " + app.appid + ", Chromecast will try to connect to " + app.receiverurl);
		console.log("> If you get a 'brain freeze error', your appid does not match the receiver url or the receiver url is not accesable from the Chromecast.");
		console.log("> If your Chromecast undertakes no action, then their's probably something wrong with your whitelisted urls (eg: wrong Chromecast)");
		device.launch(app.appid, {v:''}, function (err) {
			if(err) return callback(err);
			return callback(null, deviceName);
		});
	});

	chromecast.discover();
}

app.get('/openurl', function (req, res) {
	if(!req.query.url) return utils.sendError('no url specified', res);

	io.sockets.emit('openurl', req.query.url);

	res.send(200);
});






