var Q = require('q');
var express = require('express');
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var app = express();

var client = new elasticsearch.Client({ host: '192.168.100.15:9200', log: 'trace', apiVersion: '2.0' });

app.use(express.static('public'));
app.use(bodyParser.json());

app.param('id', function(req, res, next) {
  next();
});

app.get('/example', function(request, response) {
  response.send({success: "true"});
});

app.post('/example/:id', function(request, response) {
  console.log(request.body, request.params.id, 'query', request.query);
  response.sendStatus(200);
});

app.post('/another/example', function(request, response) {
  response.redirect('/example');
});


app.post('/tada/go', function(request, response) {   
  console.log(request.body.clientCommand);

  var clientCommand = request.body.clientCommand;
  if(isFlightInText(clientCommand)) {
    //response.sendStatus(200);

    var commandResponse = parseClientCommand(clientCommand);
    if (commandResponse.status) {
     response.send(commandResponse);
    }
    else {
      response.status(400).send(commandResponse);  
    }
  }
  else {
    var commandResponse = {message:"syntax error 'flight' word not found"};
    console.log(commandResponse);
    response.status(400).send(commandResponse);  
  }
});

app.post('/tada/autoComplete', function(request, response) {
  console.log(request.body.clientPartialCommand);
  console.log(request.body.clientCursorPosition);
  var clientPartialCommand = request.body.clientPartialCommand;
  var clientCursorPosition = request.body.clientCursorPosition;
  var autoCompleteOptions = getAutoCompleteOptions(clientPartialCommand, clientCursorPosition);
  response.send(autoCompleteOptions);
});

app.post('/tada/autoCompleteLocations', function(request, response){
  console.log(request.body.clientPartialCommand);
  var clientPartialCommand = request.body.clientPartialCommand;
  getAutoCompleteLocations(clientPartialCommand).then(function(results) {
    response.send(results); 
  });  
  
});

function resultToJson(result) {
  return _.merge({id: result._id}, result._source);
}

function parseClientCommand(clientCommand) {
  var commandWords = clientCommand.split(' ');
  var commandResponse;
  try {
    switch(commandWords[0]) {
      case 'book' :
        var bookingRequest = parseBookingRequest(commandWords);        
        commandResponse = bookFlight(bookingRequest);
        break;


    case 'search' :
       console.log("in case search flight " );
       var searchFlightRequest = parseSearchFlightRequest(commandWords);
   
       commandResponse = findMyFilghtBro(searchFlightRequest);
       console.log("redirect URL is : " + commandResponse);
     break;
      
      case 'cancel' :
        break;
    }    
    return commandResponse;
  }
  catch(err) {

    return {
      error : err
    };
  }
}

function bookFlight(bookingRequest)
{
  if (bookingRequest.origin != null && isLocationExist(bookingRequest.origin) && 
      bookingRequest.destination != null && isLocationExist(bookingRequest.destination) &&
      bookingRequest.departureDate != null && bookingRequest.returnDate != null &&
      bookingRequest.pax != null && bookingRequest.maxPrice != null)
  {
    return {status:true,message:"",flightNumber:getFlightNumber()};
  }
  else
  {
    return {status:false,message:getBookFlightErrorMessage(bookingRequest),flightNumber:""};
  }
}

function getBookFlightErrorMessage(bookingRequest)
{
  if(bookingRequest.origin == null || !isLocationExist(bookingRequest.origin))
  {
    return "The origin location is missing";
  }
  else if(bookingRequest.destination == null || !isLocationExist(bookingRequest.destination))
  {
    return "The destination location is missing";
  }
  else if(bookingRequest.departureDate == null || bookingRequest.returnDate == null)
  {
    return "The date of the flight is missing";
  }
  else if(bookingRequest.pax == null)
  {
    return "The number of passangers is missing";
  }
  else if(bookingRequest.maxPrice == null)
  {
    return "The maxprice is missing";
  }
}

function isLocationExist(str)
{
  // TODO: Check is location exists in the DB
  return true;
}

function getFlightNumber()
{
    var text = "";
    var possibleFlightName = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var possibleFlightNum = "0123456789";

    for( var i=0; i < 2; i++ )
        text += possibleFlightName.charAt(Math.floor(Math.random() * possibleFlightName.length));

    for( var i=0; i < 3; i++ )
        text += possibleFlightNum.charAt(Math.floor(Math.random() * possibleFlightNum.length));
    

    return text;
}

function parseBookingRequest(commandWords) {
   var bookingRequest = new Object();
   
   if(commandWords[1] !== 'flight') {
      throw "syntax error 'flight' word not found";
   }


   for(var i = 2 ; i < commandWords.length ; i++) {
      switch(commandWords[i]) {
        case 'from' :
          i++;
          bookingRequest.origin = commandWords[i];
          console.log('origin parsed: ' + bookingRequest.origin);
          break;
        case 'to' :
          i++;
          bookingRequest.destination = commandWords[i];
          console.log('destination parsed: ' + bookingRequest.destination);
          break;

        case 'on' :
          i++;
          bookingRequest.departureDate = commandWords[i];
          console.log('departureDate parsed: ' + bookingRequest.departureDate);
          break;
        case 'return' :
          i++;
          if(commandWords[i] !== 'on') {
            throw "'on' word not found in return statement";
          }
          i++;
          bookingRequest.returnDate = commandWords[i];
          console.log('returnDate parsed: ' + bookingRequest.returnDate);
          break;
        case 'for' :          
          i++;
          bookingRequest.pax = commandWords[i];// parsInt(commandWords[i]);          
          i++;          
          if(commandWords[i] !=  'passangers') {
            throw "'passangers' word not found";
          }
          console.log('pax parsed: ' + bookingRequest.pax);
          break;
        case 'maxprice' :
          i++;
          bookingRequest.maxPrice = commandWords[i];
          console.log('maxPrice parsed: ' + bookingRequest.maxPrice);
          break;
      }
   }


   return bookingRequest;  
  
}

function parseSearchFlightRequest(commandWords) {
  return {
    origin : "Tel Aviv",
    destination : "Berlin",
    departureDate : "01/11/2015",
    returnDate : "10/11/2015",
    pax : 4,
    maxPrice : 300
  }
}

function findMyFilghtBro(flightSearchRequest) {
  
  var redirectUrl1 = "https://www.google.com/flights/#search;f=TLV;t=BER,TXL,SXF,QPP;d=2015-11-18;r=2015-11-22"
 // console.log("url to redirect : " + redirectUrl1 );
  return{
    url : redirectUrl1
  }
}

function getCities(beginLetters)
{ 
  return client.search({index: 'tada10', type: 'cities',     
    body: { 
            query: {
                      filtered: {
                                  filter: {
                                            prefix: {
                                                        city : beginLetters
                                                    }  
                                          }              
                                }         
                    }     
          }
        }
    );  
}

function getAutoCompleteOptions(clientPartialCommand, clientCursorPosition) {
    if(clientPartialCommand === '') {
      return [ 'book', 'search', 'cancel'];
    }

    var clientPartialCommandWords = clientPartialCommand.split(' ');

    console.log(clientPartialCommandWords);

    if(clientPartialCommandWords.length === 2 && clientPartialCommandWords[1] === '') {
      return [ clientPartialCommand + ' flight', 
               clientPartialCommand + ' hotel',
               clientPartialCommand + ' car' ];
    }

    var autoCompleteOptionsDefault = ['to', 'from', 'on', 'return on', 'for', 'maxprice'];

    if(autoCompleteOptionsDefault.indexOf(clientPartialCommandWords[clientPartialCommandWords.length - 2]) >= 0) {
        return [];
    }

    if(clientPartialCommandWords[clientPartialCommandWords.length - 2] === 'return') {
      return [clientPartialCommand + ' ' + ' on'];
    }

    if(clientPartialCommandWords[clientPartialCommandWords.length - 3] === 'for') {
      return [clientPartialCommand + ' ' + ' passangers'];
    }    
    
    var autoCompleteOptions = [];

      for(var i in autoCompleteOptionsDefault) {
      if(clientPartialCommand.search(autoCompleteOptionsDefault[i]) < 0) {
         autoCompleteOptions.push(clientPartialCommand + ' ' + autoCompleteOptionsDefault[i]);
      }
    }

    return autoCompleteOptions;
}

function getAutoCompleteLocations(clientPartialCommand) { 

  var clientPartialCommandWords = clientPartialCommand.split(' ');
  if(clientPartialCommandWords[clientPartialCommandWords.length - 2] === 'from' ||
     clientPartialCommandWords[clientPartialCommandWords.length - 2] === 'to') {
    var locationStartLetters = clientPartialCommandWords[clientPartialCommandWords.length - 1];
    return getCities(locationStartLetters).then(function(results) {
      var cities = [];     
      for(var i = 0 ; i < results.hits.hits.length ; i++) {        
        var startingStr = clientPartialCommand.substring(0, clientPartialCommand.length - locationStartLetters.length - 1);
        cities.push(startingStr + ' ' + results.hits.hits[i]._source.city);
      }      
      return cities;
    });
  }

  return undefined;
}

function checkLocation(locationName) {
  // TODO: Exact Search in Elastic
}

function doFuzzyQuery(locationName) {
  // TODO: Fuzzy Search in Elastic
}

app.route('/resources')
  .get(function(request, response) {
    client.search({
      index: 'myindex',
      type: 'resources'
    }).then(
      function(resources) {
        response.send(_.map(resources.hits.hits, resultToJson));
      },
      function() {
        response.sendStatus(500);
      }
    );
  })
  .post(function(request, response) {
    client.create({
      index: 'myindex',
      type: 'resources',
      body: request.body
    }).then(function(result) {
      return getResourceById(result._id).then(function(object) {
        response.send(object);
      });
    }).catch(function() {
      response.sendStatus(500);
    });
  });

function getResourceById(id) {
  return client.get({
    index: 'myindex',
    type: 'resources',
    id: id
  }).then(function(result) {
    return resultToJson(result);
  });
}

function isFlightInText(str)
{
  console.log(str);
  if (str.search("book flight") < 0 &&  str.search("search flight") < 0)
    return false;
  else
    return true;
}
app.route('/resources/:id')
  .get(function(request, response) {
    getResourceById(request.params.id).then(function(result) {
      response.send(result);
    }).catch(function(error) {
      if (error instanceof elasticsearch.errors.NotFound) {
        response.sendStatus(404);
      } else {
        response.sendStatus(500);
      }
    });
  })
  .delete(function(request, response) {
    client.delete({
      index: 'myindex',
      type: 'resources',
      id: request.params.id
    }).then(function(result) {
      response.sendStatus(204);
    }).catch(function(error) {
      if (error instanceof elasticsearch.errors.NotFound) {
        response.sendStatus(404);
      } else {
        response.sendStatus(500);
      }
    });
  })
  .put(function(request, response) {
    // NOTE: this is a partial update
    client.update({
      index: 'myindex',
      type: 'resources',
      id: request.params.id,
      body: {doc: request.body}
    }).then(function(result) {
      return getResourceById(result._id).then(function(object) {
        response.send(object);
      });
    }).catch(function(error) {
      if (error instanceof elasticsearch.errors.NotFound) {
        response.sendStatus(404);
      } else {
        response.sendStatus(500);
      }
    });
  });


client.ping({requestTimeout: 3000, hello: 'hey'}).then(
  function() {
    var server = app.listen(3000, function() {
      var host = server.address().address;
      var port = server.address().port;

      console.log(' [*] Listening at http://%s:%s', host, port);
    });
  },
  function(err) {
    process.exit(1);
  }
);
