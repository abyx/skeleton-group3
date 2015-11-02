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
    //response.sendStatus(200);
    var commandResponse = parseClientCommand(clientCommand);
    response.send(commandResponse);
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
  var commandResponse;
  try {
    switch(commandWords[0]) {
      case 'book' :
        var bookingRequest = parseBookingRequest(commandWords);
        commandResponse = bookFlight(bookingRequest);
        break;

      case 'search' :

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

function parseBookingRequest(commandWords) {
   var bookingRequest = new Object();
   
   if(commandWords[1] !== 'flight') {
      throw "'flight' world not found";
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
          break;
          bookingRequest.departureDate = commandWords[i];
          console.log('departureDate parsed: ' + bookingRequest.departureDate);
        case 'return' :
          i++;
          if(commandWords[i] !== 'on') {
            throw "'on' word not found in return statement";
          }
          i++
          bookingRequest.returnDate = commandWords[i];
          console.log('returnDate parsed: ' + bookingRequest.returnDate);
        case 'for' :
          i++;
          bookingRequest.pax = parsInt(commandWords[i]);
          i++;
          if(commandWords[i] !== 'passangers') {
            throw "'passangers' word not found";
          }
          console.log('pax parsed: ' + bookingRequest.pax);
      }
   }


   return bookingRequest;
  
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
