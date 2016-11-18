'use strict';

// Fast, unopinionated, minimalist web framework
var app = require('express')();
// Express/Connect middleware for segment-able url redirects
var redirects = require('redirects');
// To use the HTTP server and client
var http = require('http');
// compression middleware
var compression = require('compression');
// middleware for dynamically or statically enabling CORS in express/connect applications
var cors = require('cors');
// Various tools for using and integrating with Swagger
var swaggerTools = require('swagger-tools');
// YAML 1.2 parser and serializer
var jsyaml = require('js-yaml');
// File I/O is provided by simple wrappers around standard POSIX functions
var fs = require('fs');
// HTTP request logger middleware
var logger = require('morgan');
// The official low-level Elasticsearch client
var elasticsearch = require('elasticsearch');

// Variables d'environnement fournit par Docker
var serverPort = process.env.API_PORT_80_TCP_PORT || 8081;   // set our port
var dbHost = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
var dbPort = process.env.DB_PORT_9200_TCP_PORT || 9200

// Le client Elasticsearch
var client = new elasticsearch.Client({
  host: dbHost + ':' + dbPort
  // , log: 'trace'
});

// middleware Catch-all des erreurs
var errorCatcher = function(err, req, res, next) {
  if (err.status) {
    // Erreur Elasticsearch
    res.status(err.status).json({
      status: err.status,
      message: err.message
    });
  } else if (err.failedValidation){
    // Error Swagger de validation des paramètres
    res.status(400).json({
      status: 400,
      message: err.message
    });
  } else {
    console.trace(err);
    res.sendStatus(500);
  }
};

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

app.use(compression());
app.use(cors());
app.use(logger('combined'));

// Rend le client elasticsearch accessible aux routers
app.use(function(req, res, next) {
  req.esClient = client;
  next();
});

// Réagit en cas d'appel à la racine du serveur
app.use('/', redirects({'/': '/docs'}));

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Catch-all des erreurs
  // Les 4 paramètres sont requis dans la signature de la méthode
  app.use(errorCatcher);

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  // Start the server
  http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
});
