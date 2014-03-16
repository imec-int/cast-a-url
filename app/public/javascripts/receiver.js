var Receiver = function (options){
	var socket;

	var init = function () {
		initSocket();
	};

	var initSocket = function (){
		if(socket) return; // already initialized

		// socket.io initialiseren
		socket = io.connect(window.location.hostname);
		// some debugging statements concerning socket.io
		socket.on('reconnecting', function(seconds){
			console.log('reconnecting in ' + seconds + ' seconds');
		});
		socket.on('reconnect', function(){
			console.log('reconnected');
		});
		socket.on('reconnect_failed', function(){
			console.log('failed to reconnect');
		});
		// add ourselves to the 'chromecast' room
		socket.on('connect', function() {
			console.log('socket connected');
		});

		socket.on('openurl', onOpenurl);
	};

	var onOpenurl = function (url) {
		$('iframe').attr('src', url)
	};

	return {
		init: init
	};
};


$(function(){
	var receiver = new Receiver();
	receiver.init();
});




