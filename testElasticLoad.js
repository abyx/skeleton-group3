var fs = require('fs');
var csv = require("fast-csv");
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({ host: 'localhost:9200', log: 'trace', apiVersion: '2.0' });

client.search({
            index:'tada10',
            type:'cities',
            q:'city:berlin' }).then(function(resources)
            {console.log('Found  object:',resources.hits.hits);})
            
