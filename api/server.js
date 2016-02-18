(function(){
  'use strict'

  // call the packages we need
  var express       = require('express');       // call express
  var app           = express();                // define our app using express
  var bodyParser    = require('body-parser');
  var Promise       = require('promise');
  var elasticsearch = require('elasticsearch');

  var port          = process.env.API_PORT_80_TCP_PORT || 80;   // set our port
  var dbHost        = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
  var dbPort        = process.env.DB_PORT_9200_TCP_PORT || 9200
  var client        = new elasticsearch.Client({
    host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
    , log: 'trace'
  });

  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Dictionnaire des typologies FPTLV
  var typologies = {
    '0': {
      'code': '0',
      'libelle': 'Développement professionnel continu'
    },
    '1': {
      'code': '1',
      'libelle': 'Formation professionnelle initiale'
    },
    '2': {
      'code': '2',
      'libelle': 'Formation continue ou Développement des connaissances et des compétences'
    },
    '3': {
      'code': '3',
      'libelle': 'Préparation concours et examens'
    },
    '4': {
      'code': '4',
      'libelle': 'Etude Promotionnelle ou Promotion professionnelle (EP)'
    },
    '5': {
      'code': '5',
      'libelle': 'Action de conversion'
    },
    '6': {
      'code': '6',
      'libelle': 'Congé de Formation Professionnelle (CFP)'
    },
    '7': {
      'code': '7',
      'libelle': 'Bilan de compétences'
    },
    '8': {
      'code': '8',
      'libelle': 'Validation des Acquis de l\'Expérience (VAE)'
    }
  };

  // Nom des champs indexés par type
  var fields = {
    regions: ['code', 'denomination'],
    axes: ['region', 'exercice', 'num', 'intitule'],
    actions: ['region', 'exercice', 'axe', 'typologie']
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


  // QUERIES ES
  // ==========================================================================

  var searchQuery = function(searchParams) {
    return client.search(searchParams);
  }

  var getQuery = function(getParams) {
    return client.get(getParams);
  }

  // MAPPING ES -> API
  // ==========================================================================

  var mapHitToRegion = function(hit){
    return Promise.resolve(hit._source);
  };

  var mapHitToAxe = function(hit) {
    hit._source.id = hit._id;
    return Promise.resolve(hit._source);
  };

  var mapHitToAction = function(hit) {
    var action = hit._source;

    // Ajoute l'id de l'action
    action.id = hit._id;

    // Retire la propriété _publie
    delete action._publie;

    // Remplace le code de typologigie par la typologie FPTLV
    if (action.typologie) {
      action.typologie = typologies[action.typologie];
    }

    // Remplace l'id d'axe par l'axe de formation
    var p;
    if (action.axe) {
      p = getQuery({
        index: 'par',
        type: 'axes',
        id: action.axe
      })
      .then(function(axeHit) {
        mapHitToAxe(axeHit).then(function(axe) {
          action.axe = axe;

          // delete action.axe.id;
          delete action.axe.region;
          delete action.axe.exercice;

          return action;
        });


        return action;
      }).catch(function(error) {
        console.warn(error);
        delete action.axe;
        return action;
      });

    } else {
      p = Promise.resolve(action);
    }

    return p;
  };

  var mapHitsToCollection = function(hits, mapInstanceFn) {

    return Promise.all(hits.hits.map(mapInstanceFn)).then(function(items) {
      return {
        total: hits.total,
        items: items
      };
    });

  };

  // ROUTES FOR OUR API
  // ==========================================================================

  var catchError = function(res, error){
    console.trace(error.message);
    res.status(error.status).json({
      status: error.status,
      message: error.message
    });
  };

  var prepareGetParams = function(req, res, next) {
    req.getParams = {
      index: 'par'
    }
    next();
  };

  var prepareGetRegionParams = function(req, res, next) {
    req.getParams.type = 'regions';
    req.getParams.id = req.params.code;
    next();
  };

  var prepareGetAxeParams = function(req, res, next) {
    req.getParams.type = 'axes';
    req.getParams.id = req.params.id;
    next();
  };

  var prepareGetActionParams = function(req, res, next) {
    req.getParams.type = 'actions';
    req.getParams.id = req.params.id;
    next();
  };

  var prepareSearchParams = function(req, res, next){
    req.searchParams = {
      index: 'par',
      body: {
        query: {
          bool: {
          }
        }
      }
    };

    if(req.query.offset){
      try {
        var from = parseInt(req.query.offset);
        if (size < 0) {
          throw size + " < 0"
        }
        req.searchParams.from = parseInt(req.query.offset);
      } catch (err) {
        console.warn('Le paramètre offset doit être un entier positif', err);
      }
    }

    if(req.query.limit){
      try {
        var size = parseInt(req.query.limit);
        if (size < 1) {
          throw size + " < 1"
        }
        req.searchParams.size = size;
      } catch (err) {
        console.warn('Le paramètre limit doit être un entier strictement positif.', err);
      }
    }

    if(req.query.q){
      req.searchParams.body.query.bool.must = {
        query_string: {
          query: req.query.q
        }
      };

    }

    next();

  };

  var prepareSearchRegionsParams = function(req, res, next) {
    req.searchParams.type = 'regions'
    req.fields = fields.regions;
    next();
  };

  var prepareSearchAxesParams = function(req, res, next) {
    req.searchParams.type = 'axes'
    req.fields = fields.axes;
    next();
  };

  var prepareSearchActionsParams = function(req, res, next) {
    req.searchParams.type = 'actions'
    req.fields = fields.actions;
    next();
  };

  var prepareSearchFilterParams = function(req, res, next) {
    req.searchParams.body.query.bool.filter = req.fields.map(function(field) {
      var term;
      if (req.query[field]) {
        term = {
          term: {  }
        }
        term.term[field] = req.query[field];

        return term;
      } else {
        return null;
      }
    }).filter(function(p) {
      return p;
    });

    next();
  };

  var prepareSearchSortParams = function(req, res, next){
    if(req.query.sortedBy){

      req.searchParams.body.sort = req.query.sortedBy.split(',').map(function(field) {
        return field.trim();
      }).map(function(signedfield) {
        var order , field;
        var result = {};

        if (signedfield.slice(0, 1) === '-'){
          order = 'desc';
          field = signedfield.slice(1, signedfield.length);
        } else {
          order = 'asc';
          field = signedfield;
        }

        if (req.fields.indexOf(field) >= 0) {
          result[field] = {order: order};

          return result;
        } else {
          return null;
        }

      }).filter(function(p) {
        // Retire les valeurs null
        return p;
      });

    }

    next();
  };



  var searchRegions = function(req, res){

    searchQuery(req.searchParams)
    .then(function(searchResult){
      return mapHitsToCollection(searchResult.hits, mapHitToRegion);
    })
    .then(function(regions){
      res.json(regions);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getRegion = function(req, res){
    getQuery(req.getParams)
    .then(function(result){
      return mapHitToRegion(result);
    })
    .then(function(region){
      res.json(region);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  var searchAxes = function(req, res){
    searchQuery(req.searchParams)
    .then(function(searchResult){
      return mapHitsToCollection(searchResult.hits, mapHitToAxe);
    })
    .then(function(axes){
      res.json(axes);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getAxe = function(req, res){
    getQuery(req.getParams)
    .then(function(result){
      return mapHitToAxe(result);
    })
    .then(function(region){
      res.json(region);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  var searchActions = function(req, res){
    // On ajoute au filtre construit avec les paramètres de la requête
    // un filtre n'acceptant pas les actions non publiées.
    if (!req.searchParams.body.query.bool.filter) {
      req.searchParams.body.query.bool.filter = [];
    }

    req.searchParams.body.query.bool.filter.push({
      term: { _publie: true }
    });

    searchQuery(req.searchParams)
    .then(function(searchResult){
      return mapHitsToCollection(searchResult.hits, mapHitToAction);
    })
    .then(function(actions){
      res.json(actions);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getAction = function(req, res){
    getQuery(req.getParams)
    .then(function(hit){
      return mapHitToAction(hit);
    })
    .then(function(action){
      res.json(action);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  // Routes

  var router = express.Router();       // get an instance of the express Router

  router.get('/par/regions', [
    prepareSearchParams,
    prepareSearchRegionsParams,
    prepareSearchFilterParams,
    prepareSearchSortParams,
    searchRegions
  ]);

  router.get('/par/regions/:code', [
    prepareGetParams,
    prepareGetRegionParams,
    getRegion
  ]);

  router.get('/par/axes', [
    prepareSearchParams,
    prepareSearchAxesParams,
    prepareSearchFilterParams,
    prepareSearchSortParams,
    searchAxes
  ]);

  router.get('/par/axes/:id', [
    prepareGetParams,
    prepareGetAxeParams,
    getAxe
  ]);

  router.get('/par/actions', [
    prepareSearchParams,
    prepareSearchActionsParams,
    prepareSearchFilterParams,
    prepareSearchSortParams,
    searchActions
  ]);

  router.get('/par/actions/:id', [
    prepareGetParams,
    prepareGetActionParams,
    getAction
  ]);

  var rootRouter = express.Router();       // get another instance of the express Router
  rootRouter.get('/', function(req, res) {
    var s = 'Bienvenue sur l\'API temporaire de Gesform Evolution. '
    s += 'SVP, visitez https://goo.gl/WCe8cR pour plus d\'informations sur cette API.'
    res.send(s);
  });

  // REGISTER OUR ROUTES -------------------------------
  // all of our routes will be prefixed with /api/v1
  app.use('/api/v1', router);
  app.use('/', rootRouter);

  // START THE SERVER
  // =============================================================================
  var server = app.listen(port, function(){
    var _host = server.address().address;
    var _port = server.address().port;
    console.log('Listening at http://%s:%s', _host, _port);
  });
})();
