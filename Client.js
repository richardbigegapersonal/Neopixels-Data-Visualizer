var Client = require('node-rest-client').Client;


// configure basic http auth for every request
var options_auth = { user: "----", password: "------" };



var client = new Client(options_auth);

var endpoint = "--endpoint----$filter=CreatedOn ge '20160715' and CreatedAt gt '122005' and CreatedOn ge '20160715' and CreatedAt le '124005'";
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

module.exports = {
   
    execute: function(){
        console.log('g1: inside ---->>>>>>');
        return executeSAPODataServiceCall();
    }
};

