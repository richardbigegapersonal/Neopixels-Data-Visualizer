var express = require('express');
var app = express();
var logger = require('./logger');
var urlT = require('./urlTrimmer');


// var pulse2 = require('./pulse');
// console.log('sending VSS');
// pulse2.sendPulse('VSS');
// console.log('sending VSS');
// pulse2.sendPulse('VSS');

// var i = 0;
// while(i < 100000) {
	// if (i % 100 == 0) {
		// var pulse2 = require('./pulse');
		// console.log('again');
		// console.log('sending RefLab');
		// pulse2.sendPulse('RefLab');
	// }
	// i++;
// }

console.log(urlT.getUpdatedEndPoint());

app.get('/Online_Orders/:type', function(req, res) {
	var pulse = require('./pulse');
	var type = req.params.type;
	pulse.sendPulse(type);
	res.send('yo');
});

app.listen(8088, function() {
	var pulse2 = require('./pulse');
	logger.log('info', 'pulseTest.js', 'listening on http://localhost:' + 8088);
	
	pulse2.cleanSlate();
	pulse2.cleanSlate(); // have to do it a second time for some reason so it doesn't sparkle..
	pulse2.startup();
});
	



function sleep(milliseconds) {
        var tempTime = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - tempTime) > milliseconds){
                        break;
                }
        }
}

/*
module.exports = {
 
    startupServer: function(){
        console.log('Starting server::::');
        return startServer();
    }
};
*/