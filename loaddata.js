 
var fs = require('fs');
var csv = require("fast-csv");
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({ host: 'localhost:9200', log: 'trace', apiVersion: '2.0' });



var stream = fs.createReadStream("C:\\Users\\012-user\\Desktop\\airports.csv");

/*client.get({
            index:'tada',
            type:'citeis',
            id:'AVDR2zVCrWC5JWTZssek' }).then(function(result)
            {console.log('Found  object:',   result._source, 'with   id:',   result._id);  })*/
            


csv
 .fromStream(stream, {headers : ["municipality"]})
 .on("data", function(data){


     console.log(data.municipality);
     client.create({
        index:'tada11',
        type:'cities',
        body:{city: data.municipality}}).then(function(result)
            {console.log('The saved City has ID:',result._id);})
        .catch(function() {   console.error('Could not save Debil')});

 })
 .on("end", function(){
     console.log("done");
 });

 




 