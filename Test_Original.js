/**
* Created by ppierrelouis on 8/17/16.
*/
var ClientTest = require('./parent_Copy.js');
var serverChild= require('./pulseTest.js')

serverChild.startupServer();
console.log('CLient =====> ', ClientTest.execute());

