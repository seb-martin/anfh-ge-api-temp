(function() {
  'use strict';

  var port = 80;

  // call the packages we need
  var express       = require('express');       // call express
  var compression   = require('compression');

  var app = express();

  app.use(compression());
  app.use(express.static(__dirname + '/dist'));

  app.listen(port, function() {
    console.info('Listening at', port);
  });

}())
