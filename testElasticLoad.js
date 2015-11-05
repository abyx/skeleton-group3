var fs = require('fs');
var csv = require("fast-csv");
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({ host: 'localhost:9200', log: 'trace', apiVersion: '2.0' });
/*
client.search({
            index:'tada11',
            type:'cities',
            q:'city:burlin' }).then(function(resources)
            {console.log('Found  object:',resources.hits.hits);})

*/
/*
client.search(
 	{
 	index: 'tada11', type: 'cities',     
    	
            query: {
        	    	fuzzy:{
            	        	  city: {
                	                  value: "burlin",
                                           "fuzziness": 2
      									   
                                          }              
                          }         
                   }   
         
    }
);  
*/

 client.search(
 	{
 	index: 'tada11', type: 'cities',     
    	body: { 
            query: {
        	    	match:{
            	        	  city: {
                	                  query: "brelin",
                                           "fuzziness": 5,
      									   "prefix_length": 1,
      									   
                                          }              
                          }         
                   }   
              }  
    }
);  

