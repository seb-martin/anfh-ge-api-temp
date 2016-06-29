(function(){
  'use strict'

  // call the packages we need
  var express          = require('express');       // call express
  var compression      = require('compression');
  var cors             = require('cors');
  var bodyParser       = require('body-parser');
  var elasticsearch    = require('elasticsearch');
  var logger           = require('morgan');

  var port             = process.env.API_PORT_80_TCP_PORT || 8082;   // set our port
  var dbHost           = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
  var dbPort           = process.env.DB_PORT_9200_TCP_PORT || 9200

  var client           = new elasticsearch.Client({
    host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
    // , log: 'trace'
  });

  var app = express();                // define our app using express
  app.use(compression());
  app.use(cors());
  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(logger('combined'));


  // Rend le client elasticsearch accessible aux routers
  app.use(function(req, res, next) {
    req.esClient = client;
    next();
  });

  // Nom des champs indexés par type
  // Procède à un ping du serveur elasticsearch
  (function(){
    client.ping({
      requestTimeout: 30000,

      // undocumented params are appended to the query string
      hello: "elasticsearch"
    }, function (error) {
      if (error) {
        console.error('elasticsearch cluster is down!');
      } else {
        console.log('All is well');
      }
    });
  })();

  // REGISTER OUR ROUTES -------------------------------
  app.use('/', require('./root'));
  app.use('/preview/actions', require('./previewActions'));

  // START THE SERVER
  // =============================================================================
  var server = app.listen(port, function(){
    var _host = server.address().address;
    var _port = server.address().port;
    console.log('Listening at http://%s:%s', _host, _port);
  });
})();
