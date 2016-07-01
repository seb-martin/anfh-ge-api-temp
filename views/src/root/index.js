(function() {
  'use strict';

  var express = require('express');

  var app = express();

  var rootRouter = express.Router();

  rootRouter.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    var s = 'Bienvenue sur le service de visualisation des plans d\'actions régionaux.'
    res.end(s);
  });

  module.exports = rootRouter;
})();
