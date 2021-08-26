	/**
	* Wrote by Richard M Bigega--Summer IT Software development Intern on 8/25/2016
	* This files makes a call to a JSON url--pointing on SAP HANA data of IDEXX
	* and sends a pulse.sendPulse(type) depending on the number of orders.
	*/

	var request = require('request');
	//var HashMap = require('hashmap');
	var Array = require('array');
	var parent_Copy = require('./parent_Copy');

	// var urlDef='http://localhost:8080/service/getsapdata';

	// var option={
		// method: 'GET',
		// uri: urlDef
	// }

	// The function below loops through the json object, sends pulse
	//according to the types, qty, in space of time--(5min/ number of products)

	var activityMap= new Map();

	console.log(" The received JSON is: " );
	console.log(parent_Copy.getJSONData()); 
	exports.getActivityMap = function(){
		console.log('making a call to....:');
		
		 
			var myjsonobj= JSON.parse(parent_Copy.getJSONData());
			console.log('I am reaching here');
			var myListoftypes= new Array(); // Initializes an array list holding the product type for each order
			var myListofQuantity= new Array(); // Initializes an array list holding the number of products per order
			
			for(var key in myjsonobj.results){
			
			   var dataobj=myjsonobj.results[key];
			   quantity=dataobj.OrdQty;
			   if( dataobj.MatDivision =="VS" || dataobj.MatDivision =="LX"){
					 types='refLab';	  
				}else if ( dataobj.MatDivision =="VS" || dataobj.MatDivision =="LX" || dataobj.MatDivision =="VS" || dataobj.MatDivision =="LX"){
					types= 'IHD_Orders';
				}
				else if(dataobj.MatDivision =="VB"){
					types='VSS';
				}else{
					types='other';
				}
				myListoftypes.push(types)// Builds the array list of types
				myListofQuantity.push(quantity)// Builds the array list of quantity
				}
			for(var i=0; i< myListoftypes.length; i++){
					activityMap.set(myListoftypes[i], myListofQuantity[i]);
					//Builds the map <n,m> where n is type and m the quantity--- this will allow to easily access and do operations on both types and qnatity
				}
				console.log( "jsonParser.js ~~ Activity Map: " + activityMap);
				return activityMap;
			}
			
		

