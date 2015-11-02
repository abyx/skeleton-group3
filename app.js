var Q = require('q');
var express = require('express');
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var _ = require('lodash');
var app = express();

var client = new elasticsearch.Client({ host: 'localhost:9200', log: 'trace', apiVersion: '2.0' });

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


app.post('/tada', function(request, response) {   
  console.log(request.body.clientCommand);

  var clientCommand = request.body.clientCommand;
  if(isFlightInText(clientCommand)) {
    response.sendStatus(200);
  }
  else {
    response.sendStatus(400);  
  }
});

function resultToJson(result) {
  return _.merge({id: result._id}, result._source);
}


function parseClientCommand(clientCommand) {
  var commandWords = clientCommand.split(' ');
  switch(commandWords[0]) {
    case 'book flight' :
      var bookingRequest = parseBookingRequest(commandWords);
      var bookingResponse = bookFlight(bookingRequest);
      break;

    case 'find flight' :

      break;

    case 'cancel booking' :
      break;
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
    return "The original location is missing";
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
    return "The price is missing";
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
  return {
    origin : "Tel Aviv",
    destination : "Berlin",
    departureDate : "01/11/2015",
    returnDate : "10/11/2015",
    pax : 4,
    maxPrice : 300
  }
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
  if (str.search("book flight") < 0)
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
