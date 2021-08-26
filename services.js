/*
 This NodeJS App functionality will create a web presence for the jason files
*/

var express = require('express');
var app = express();
var logger = require('./logger');
var fs = require('fs'); // File sharing nodejs module

var port = 8080;

var sapdatajsonfile = 'online_Orders.json';

app.get('/service/:cmd', function(req, res) {
	var cmd = req.params.cmd;
	if (cmd == 'getsapdata') {
		logger.log('info', 'services.js', 'getsapdata command called, parsing...');
		var obj;
		fs.readFile(sapdatajsonfile, 'utf8', function (err, data) {
			if (err) throw err;
			//obj = JSON.parse(data);
			res.end(data);
		});	
		logger.log('info', 'services.js', 'parsing compelte');
	} else {
		logger.log('info', 'services.js', 'command ' + cmd + ' called but not recognized');
		res.end('Command ' + cmd + ' not recognized');
	}
	
});

var server = app.listen(port, function() {
	logger.log('info', 'services.js', 'listening on http://localhost:' + port);
});

function sleep(milliseconds) {
	var tempTime = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - tempTime) > milliseconds){
			break;
		}
	}
}