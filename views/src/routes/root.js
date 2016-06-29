(function() {
  var express = require('express');
  var compression = require('compression');
  var cors = require('cors');

  var app = express();
  app.use(compression());
  app.use(cors());

  var rootRouter = express.Router();

  rootRouter.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    var s = 'Bienvenue sur le service de visualisation des plans d\'actions régionaux.'
    res.end(s);
  });

  module.exports = rootRouter;
})();
