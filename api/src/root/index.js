(function() {
  'use strict';

  var express = require('express');

  var app = express();

  var rootRouter = express.Router();

  rootRouter.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    var s = 'Bienvenue sur l\'API temporaire de Gesform Evolution. '
    s += 'SVP, visitez https://goo.gl/WCe8cR pour plus d\'informations sur cette API.'
    res.end(s);
  });

  module.exports = rootRouter;
})();
