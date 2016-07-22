(function(){
  'use strict'

  // call the packages we need
  var express       = require('express');       // call express
  var compression   = require('compression');
  var cors          = require('cors');
  var bodyParser    = require('body-parser');
  var Promise       = require('promise');
  var elasticsearch = require('elasticsearch');
  var logger        = require('morgan');

  var port          = process.env.API_PORT_80_TCP_PORT || 8081;   // set our port
  var dbHost        = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
  var dbPort        = process.env.DB_PORT_9200_TCP_PORT || 9200

  var client        = new elasticsearch.Client({
    host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
    // , log: 'trace'
  });

  var app = express();                // define our app using express

  app.use(compression());
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(logger('combined'));

  // Rend le client elasticsearch accessible aux routers
  app.use(function(req, res, next) {
    req.esClient = client;
    next();
  });

  // Chargement des domaines
  var indices = {
    anfh: require('./anfh'),
    par: require('./par')
  };

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

  // MAPPING ES -> API
  // ==========================================================================

  var mapHitsToCollection = function(req, hits, mapHitFn) {
    return Promise.all(hits.hits.map(function(hit) {
      return mapHitFn(req, hit);
    })).then(function(items) {
      return {
        total: hits.total,
        items: items
      };
    });

  };

  // ERRORS MANAGEMENT
  // ==========================================================================

  var sendError = function(res, error) {
    res.status(error.status).json(error);
  };

  // MIDDLEWARES
  // ==========================================================================

  var performGet = function(req, res, next) {
    var getParams = {
      index: req.params.index,
      type: req.params.type,
      id: req.params.id,
    }

    var index = indices[getParams.index];
    if (index) {
      var type = index[getParams.type];
      if (type) {
        req.esClient.get(getParams).then(function(hit) {
          return type.mapHitToResource(req, hit);
        }).then(function(resource) {
          if (resource === null) {
            throw {
              status: 404
            };
          } else {
            res.json(resource);
          }
        }).catch(function(error){
          if (error.status === 404) {
            sendError(res, {
              status: 404,
              message: 'Ressource d\'identifiant ' + getParams.id + ' de type ' + getParams.type + ' dans le domaine ' + getParams.index + ' introuvable'
            });
          } else {
            next(error);
          }
        });
      } else {
        sendError(res, {
          status: 404,
          message: 'Type de resource ' + getParams.type + ' dans domaine ' + getParams.index + ' introuvale'
        });
      }
    } else {
      sendError(res, {
        status: 404,
        message: 'Domaine ' + getParams.index + ' introuvable'
      });
    }
  };

  var performSearch = function(req, res, next) {

    var searchParams = {
      index: req.params.index,
      type: req.params.type,
      body: {
        query: {
          bool: {
          }
        }
      }
    };

    var index = indices[searchParams.index];
    if (index) {
      var type = index[searchParams.type];
      if (type) {

        // Offset
        if(req.query.offset){
          try {
            var from = parseInt(req.query.offset);
            if (isNaN(from)) {
              throw req.query.offset + ' n\'est pas un nombre';
            } else if (from < 0) {
              throw from + " < 0";
            } else {
              searchParams.from = from;
            }
          } catch (err) {
            sendError(res, {
              status: 400,
              message: 'Le paramètre offset doit être un entier positif'
            });
            return;
          }
        }

        // Limit
        if(req.query.limit){
          try {
            var size = parseInt(req.query.limit);

            if (isNaN(size)) {
              throw req.query.limit + ' n\'est pas un nombre';
            } else if (size < 1) {
              throw size + " < 1";
            } else {
              searchParams.size = size;
            }
          } catch (err) {
            sendError(res, {
              status: 400,
              message: 'Le paramètre limit doit être un entier strictement positif : ' + err
            });
            return;
          }
        }

        // Query (paramètre q)
        if(req.query.q){
          searchParams.body.query.bool.must = {
            query_string: {
              query: req.query.q
            }
          };

        }

        // Filter
        searchParams.body.query.bool.filter = Object.getOwnPropertyNames(type.filter_fields).map(function(field) {

          if (req.query[field]) {
            var filterField = type.filter_fields[field];

            var tokens;
            if (filterField.type === 'string' && filterField.index !== 'not_analyzed') {
              // On split pour créer une liste de jetons
              // l'apostrophe n'est pas analysée par ES comme un séparateur
              var pattern = /[^A-Za-z0-9àâçèéêîôùû\']/
              tokens = req.query[field].split(pattern).filter(function(token) {
                // Retire les éventuelles chaînes vides
                return token;
              }).map(function(token) {
                return token.toLocaleLowerCase();
              });
            } else {
              tokens = [req.query[field]];
            }

            var terms = null;
            if (tokens.length > 0) {
              terms = {
                terms: {}
              };

              terms.terms[filterField.term] = tokens;
            }

            return terms;
          } else {
            return null;
          }
        }).filter(function(terms) {
          // Retire les valeurs null
          return terms;
        });

        if (type.filters && type.filters.length > 0) {
          type.filters.forEach(function(filter) {
            searchParams.body.query.bool.filter.push({
              term: filter
            });
          });
        }

        // Sort
        if(req.query.sortedBy){

          searchParams.body.sort = req.query.sortedBy.split(',').map(function(field) {
            return field.trim();
          }).map(function(signedfield) {
            var order, field;
            var result = {};

            if (signedfield.slice(0, 1) === '-'){
              order = 'desc';
              field = signedfield.slice(1, signedfield.length);
            } else {
              order = 'asc';
              field = signedfield;
            }

            if (Object.getOwnPropertyNames(type.sort_fields).indexOf(field) >= 0) {
              result[type.sort_fields[field]] = {order: order};

              return result;
            } else {
              return null;
            }

          }).filter(function(p) {
            // Retire les valeurs null
            return p;
          });

        }

        // Exécute la recherche
        req.esClient.search(searchParams)
        .then(function(searchResult){
          return mapHitsToCollection(req, searchResult.hits, type.mapHitToResource);
        }).then(function(resources){
          res.json(resources);
        }).catch(function(error){
          next(error);
        });


      } else {
        sendError(res, {
          status: 404,
          message: 'Type de resource ' + searchParams.type + ' du domaine ' + searchParams.index + ' introuvale'
        });
      }
    } else {
      sendError(res, {
        status: 404,
        message: 'Domaine ' + searchParams.index + ' introuvable'
      });
    }
  };


  // ROUTES FOR OUR API
  // ==========================================================================

  var router = express.Router();       // get an instance of the express Router

  router.get('/:index/:type/:id', performGet);

  router.get('/:index/:type', performSearch);

  // REGISTER OUR ROUTES -------------------------------

  app.use('/', require('./root'));
  app.use('/api/v1', router);

  // Catch-all des erreurs
  // Les 4 paramètres sont requis dans la signature de la méthode
  app.use(function(err, req, res, next) {
    console.trace(err);
    if (err.status) {
      sendError(res, {
        status: err.status,
        message: err.message
      });
    } else {
      res.status(500).end();
    }
  });

  // START THE SERVER
  // =============================================================================
  var server = app.listen(port, function(){
    var _host = server.address().address;
    var _port = server.address().port;
    console.log('Listening at http://%s:%s', _host, _port);
  });
})();
