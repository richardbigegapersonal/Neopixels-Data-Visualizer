// you've got to launch me using: node --tls-cipher-list="SHA" serverParent.js

var express = require('express');
var app = express();
var request = require('request');
var soap = require('soap');
var logger = require('./logger.js');

var sdmaDogTotal;
var sdmaBadDogTotal;
var sdmaCatTotal;
var sdmaBadCatTotal;
var sdmaOtherTotal;
var sdmaBadOtherTotal;

var lastRunHour;

var port = '8080';
var totalCount = 0;

var urlDef = 'http://localhost:8081';
var wsdl = '---order---service';


app.get('/order/:orderid/:context', function(req, res) {
	totalCount++;
	//logger.log('Connection from IP ' + req.remoteAddress + '.');
	var orderid = req.params.orderid;
	var contextid = req.params.context;
	var statusStr = {
			status: "SUCCESS",
			ldeorderid: orderid,
			contextid: contextid,
			total: totalCount
		};
	res.end(JSON.stringify(statusStr));
	logger.log('info', 'serverParent.js', 'I see orderid: ' + orderid + ' contextid: ' + contextid);
	
			makeSoapCall(orderid, soapCallBack);
	
});

app.get('/service/:cmd', function(req, res) {
	var cmd = req.params.cmd;
	if (cmd == 'getsdma') {
		var statusStr = {
			status: 'SUCCESS',
			totalCalls: totalCount,
			sdmaDogTotal: sdmaDogTotal,
			sdmaBadDogTotal: sdmaBadDogTotal,
			sdmaCatTotal: sdmaCatTotal,
			sdmaBadCatTotal: sdmaBadCatTotal,
			sdmaOtherTotal: sdmaOtherTotal,
			sdmaBadOtherTotal: sdmaBadOtherTotal
		};
		res.end(JSON.stringify(statusStr));
	} else {
		res.end('Command ' + cmd + ' not recognized');
	}
});

function makeSoapCall(ldeorderid, callBack) {
	var args = { 'lab:labReportSearchRequest': { 'lab:orderId': ldeorderid } };
	var wsdlOptions = { // our qa env is more strict, this has to be passed along
		rejectUnauthorized: false,
		strictSSL: false
		};
	soap.createClient(wsdl, function(err, client) {
		if (err != null) {
			logger.log('debug', 'serverParent.js', 'Error creating client: ' + err);
		} else {
			client.LabOrderService.LabOrderServiceSoapPort.getLabOrderDetails(args, wsdlOptions, callBack);
		}
	});
}

function resetCounters() {
	sdmaDogTotal = 0;
	sdmaBadDogTotal = 0;
	sdmaCatTotal = 0;
	sdmaBadCatTotal = 0;
	sdmaOtherTotal = 0;
	sdmaBadOtherTotal = 0;
}

function soapCallBack(err, result) {
	var d = new Date();
	var n = d.getHours();
	if (n < lastRunHour) {
		resetCounters();
	}
	lastRunHour = n;
	
	var isSdma = false;
	var isSdmaBad = false;
	
	if (err != null) {
		logger.log('debug', 'serverParent.js', 'Error making request: ' + err);
	} else {
		
		if (result.labOrderReport.labOrders != null) {
			
			var labResults = result.labOrderReport.labOrders.labOrder;
			var resultList = [];
			var lastResultCode = '';
			var lastCollectionCode = '';
			
			var collections = labResults.collections;
			for (var key in collections) {
				var collection = collections[key];
				if (collection.length == null) {
					if (lastCollectionCode == collection.code) { break; }
					logger.log('debug', 'serverParent.js', 'Collections length is null for orderid: ' + labResults.attributes.internalOrderID);
					logger.log('debug', 'serverParent.js', 'I see collection: ' + collection.code + ' name: ' + collection.name + ' for orderid: ' + labResults.attributes.internalOrderID);
					lastCollectionCode = collection.code;
					for (var key in collection.results) {
						var result = collection.results[key];
						logger.log('debug', 'serverParent.js', '    I resultlength: ' + result.length);
						for (i = 0; i < result.length; i++) {
							var resultChild = result[i];
							if (lastResultCode == resultChild.assay.code) { break; }
							resultList.push(resultChild);
							//logger.log('debug', 'serverParent.js', '    I see result: ' + JSON.stringify(resultChild));
							logger.log('debug', 'serverParent.js', '    I see result: ' + resultChild.assay.code + ' name: ' + resultChild.assay.name + ' value: ' + resultChild.value);
							lastResultCode = resultChild.assay.code;
							if (resultChild.assay.code == 'SDMA') {
								isSdma = 'true';
								if (resultChild.value > 14) {
									isSdmaBad = 'true';
								}
							}
						}
					}
				} else {
					logger.log('debug', 'serverParent.js', 'Collections length is NOT NULL for orderid: ' + labResults.attributes.internalOrderID);
					for (i = 0; i < collection.length; i++) {
						var collectionChild = collection[i];
						if (lastCollectionCode == collectionChild.code) { break; }
						//logger.log('debug', 'serverParent.js', 'I see collection: ' + collectionChild.code + ' name: ' + collectionChild.name + ' || ' + JSON.stringify(collectionChild));
						logger.log('debug', 'serverParent.js', 'I see collection: ' + collectionChild.code + ' name: ' + collectionChild.name + ' for orderid: ' + labResults.attributes.internalOrderID);
						lastCollectionCode = collectionChild.code;
						
						var lastCollectionChild2 = '';
						for (var keyC in collectionChild.collections) {
							var collectionChild2 = collectionChild.collections[keyC];
							if (lastCollectionChild2 == collectionChild2.code) { break; }
							//logger.log('debug', 'serverParent.js', 'Im in the new collectionChild2 // I see collection: ' + JSON.stringify(collectionChild2));
							logger.log('debug', 'serverParent.js', 'Im in the new collectionChild2 // I see collection: ' + collectionChild2.length);
							lastCollectionChild2 = collectionChild2.code;
							
							var lastCollectionChild3 = '';
							for( n = 0; n < collectionChild2.length; n++ ) {
								var collectionChild3 = collectionChild2[n];
								if (lastCollectionChild3 == collectionChild3.code) { break; }
								//logger.log('debug', 'serverParent.js', 'Im in collectionChild3 // ' + JSON.stringify(collectionChild3));
								logger.log('debug', 'serverParent.js', 'Im in collectionChild3 // ' + collectionChild3.name + ' for orderid: ' + labResults.attributes.internalOrderID);
								lastCollectionChild3 = collectionChild3.code;
								
								for (var key3 in collectionChild3.results) {
									var result = collectionChild3.results[key3];
									logger.log('debug', 'serverParent.js', '    I resultlength: ' + result.length);
									for (i = 0; i < result.length; i++) {
										var resultChild = result[i];
										if (lastResultCode == resultChild.assay.code) { break; }
										resultList.push(resultChild);
										//logger.log('debug', 'serverParent.js', '    I see result: ' + JSON.stringify(resultChild));
										logger.log('debug', 'serverParent.js', '    I see result: ' + resultChild.assay.code + ' name: ' + resultChild.assay.name + ' value: ' + resultChild.value);
										lastResultCode = resultChild.assay.code;
										if (resultChild.assay.code == 'SDMA') {
											isSdma = 'true';
											if (resultChild.value > 14) {
												isSdmaBad = 'true';
											}
										}
									}
								}
							}
						}
						
						for (var key in collectionChild.results) {
							var result = collectionChild.results[key];
							logger.log('debug', 'serverParent.js', '    I resultlength: ' + result.length);
							for (i = 0; i < result.length; i++) {
								var resultChild = result[i];
								if (lastResultCode == resultChild.assay.code) { break; }
								resultList.push(resultChild);
								//logger.log('debug', 'serverParent.js', '    I see result: ' + JSON.stringify(resultChild));
								logger.log('debug', 'serverParent.js', '    I see result: ' + resultChild.assay.code + ' name: ' + resultChild.assay.name + ' value: ' + resultChild.value);
								lastResultCode = resultChild.assay.code;
								if (resultChild.assay.code == 'SDMA') {
									isSdma = 'true';
									if (resultChild.value > 14) {
										isSdmaBad = 'true';
									}
								}
							}
						}
					}
				}
			}
			
			logger.log('debug', 'serverParent.js', 'Full result count is ' + resultList.length);
			
			var species = labResults.patient.species.name;
			logger.log('debug', 'serverParent.js', 'I see a species of ' + species);
			if (species == 'CANINE') { species = 'dog'; }
			else if (species == 'FELINE') { species = 'cat'; }
			else { species = 'other'; }
			
			var url = urlDef + '/species/' + species + '/' + isSdma + '/' + isSdmaBad;
			logger.log('info', 'serverParent.js', 'url: ' + url);
			
			option = { method: 'GET', uri: url }
			request( option , function(err, res, body) {
				if( err != null ) { logger.log('error', 'serverParent.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
				if(body != null) { logger.log('info', 'serverParent.js', 'Call to ' + option.uri + ' successful: ' + body); }
			});
		} else {
			logger.log('debug', 'serverParent.js', 'result.labOrderReport.labOrders IS null*****');
		}
	}
}

var server = app.listen(port, function() {
	logger.log('info', 'serverParent.js', 'listening on http://localhost:' + port);
	resetCounters();
});
