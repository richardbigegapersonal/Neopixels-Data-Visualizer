/**
* Created by ppierrelouis on 8/12/16.
*/
var Client = require('node-rest-client').Client;


// configure basic http auth for every request
var options_auth = { user: "webuser", password: "brOukO1B-Lab" };



var client = new Client(options_auth);

var endpoint = "http://devreporting.idexxi.com/idexxui/services/web/orderdetservice.xsodata/ORD_DET?$filter=CreatedOn ge '20160715' and CreatedAt gt '122005' and CreatedOn ge '20160715' and CreatedAt le '124005'";
var CreatedOn;
var format = "&$format=json";
var URL = endpoint + format;

// direct way
function executeSAPODataServiceCall(){
   return client.get(URL, function (data, response) {
        // parsed response body as js object
        console.log(data.d);
        // raw response
        console.log(response);
    });
}
/*
client.get(URL, function (data, response) {
    // parsed response body as js object
    console.log(data.d);
    // raw response
    console.log(response);
});
*/
/* For the sake of github learning */


/*
// registering remote methods
client.registerMethod("jsonMethod", "http://remote.site/rest/json/method", "GET");

client.methods.jsonMethod(function (data, response) {
    // parsed response body as js object
    console.log(data);
    // raw response
    console.log(response);
});
*/


module.exports = {
    /*
    foo: function () {
        console.log('foo: inside');
        return 'foo-001';
    },
    bar: function () {
        console.log('bar: inside');
        return 'bar-001';
    },*/
    execute: function(){
        console.log('g1: inside ---->>>>>>');
        return executeSAPODataServiceCall();
    }
};

