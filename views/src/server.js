(function(){
  'use strict'

  // call the packages we need
  var express          = require('express');       // call express
  var compression      = require('compression');
  var cors             = require('cors');
  var bodyParser       = require('body-parser');
  var Promise          = require('promise');
  var elasticsearch    = require('elasticsearch');
  var logger           = require('morgan');
  var fs               = require('fs');
  var pug              = require('pug');
  var marked           = require('marked');
  var moment           = require('moment');
  var humanizeDuration = require('humanize-duration');

  var port             = process.env.API_PORT_80_TCP_PORT || 80;   // set our port
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

  moment.locale('fr');

  // Dictionnaire des typologies FPTLV
  var typologies = {
    '0': {
      'code': '0',
      'origine': 'DPC',
      'libelle': 'Développement professionnel continu'
    },
    '1': {
      'code': '1',
      'origine': 'FPTLV',
      'libelle': 'Formation professionnelle initiale'
    },
    '2': {
      'code': '2',
      'origine': 'FPTLV',
      'libelle': 'Formation continue ou Développement des connaissances et des compétences'
    },
    '3': {
      'code': '3',
      'origine': 'FPTLV',
      'libelle': 'Préparation concours et examens'
    },
    '4': {
      'code': '4',
      'origine': 'FPTLV',
      'libelle': 'Etude Promotionnelle ou Promotion professionnelle (EP)'
    },
    '5': {
      'code': '5',
      'origine': 'FPTLV',
      'libelle': 'Action de conversion'
    },
    '6': {
      'code': '6',
      'origine': 'FPTLV',
      'libelle': 'Congé de Formation Professionnelle (CFP)'
    },
    '7': {
      'code': '7',
      'origine': 'FPTLV',
      'libelle': 'Bilan de compétences'
    },
    '8': {
      'code': '8',
      'origine': 'FPTLV',
      'libelle': 'Validation des Acquis de l\'Expérience (VAE)'
    }
  };

  // Dictionnaire des intitulés de nature
  var natures = {
    'N': {abbr:'AFN', libelle:'Action de formation nationale'},
    'R': {abbr:'AFR', libelle:'Action de formation régionale'},
    'C': {abbr:'AFC', libelle:'Action de formation coordonnée'}
  };

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


  // QUERIES ES
  // ==========================================================================

  var getQuery = function(getParams) {
    return client.get(getParams);
  }

  // MAPPING ES -> API
  // ==========================================================================

  // var mapHitToRegion = function(hit){
  //   return Promise.resolve(hit._source);
  // };

  var mapHitToAxe = function(hit) {
    hit._source.id = hit._id;
    return Promise.resolve(hit._source);
  };

  var mapHitToAction = function(hit) {
    var action = hit._source;

    // Ajoute l'id de l'action
    action.id = hit._id;

    // Remplace le code de nature par son intitulé
    if (action.nature) {
      action.nature = natures[action.nature];
    }

    // Remplace le code de typologigie par la typologie FPTLV
    if (action.typologie) {
      action.typologie = typologies[action.typologie];
    }

    // Remplace le texte en markdown par sa version en html
    action.contexte = action.contexte ? marked(action.contexte) : '';
    action.objectifs = action.objectifs ? marked(action.objectifs) : '';
    action.autre = action.autre ? marked(action.autre) : '';

    if (action.modules) {

      action.modules.forEach(function(module) {
        // Remplace le texte en markdown par sa version en html
        module.contexte = module.contexte ? marked(module.contexte) : '';
        module.objectifs = module.objectifs ? marked(module.objectifs) : '';
        module.programme = module.programme ? marked(module.programme) : '';

        // Remplace la durée au format ISO par une durée humaiinement lisible
        module.duree = module.duree ? humanizeDuration(moment.duration(module.duree).asMilliseconds(), {language: 'fr'}) : '';

      });
    }

    // Remplace les dates au format ISO par une date formattée
    if (action.planifications) {
      action.planifications.forEach(function(planification) {
        if (planification.calendrier) {
          planification.calendrier.forEach(function(evt) {
            evt.debut = evt.debut ? moment(evt.debut).format('D MMMM YYYY') : '';
            evt.fin = evt.fin ? moment(evt.fin).format('D MMMM YYYY') : '';
          })
        }
      });
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

  var prepareGetActionParams = function(req, res, next) {
    req.getParams.type = 'actions';
    req.getParams.id = req.params.id;
    next();
  };

  // Routes

  var rootRouter = express.Router();       // get another instance of the express Router
  rootRouter.get('/', function(req, res) {
    var s = 'Bienvenue sur la prévisualisation des actions de formation. '
    s += 'SVP, suffixez votre URL avec /preview/actions/ suivi de l\'identifiant de l\'action.'
    res.send(s);
  });

  var previewActionsRouter = express.Router();
  previewActionsRouter.get('/:id', [
    prepareGetParams,
    prepareGetActionParams,
    function(req, res) {
      var path = __dirname + '/templ/action.jade';
      var str = fs.readFileSync(path, 'utf-8');
      var fn = pug.compile(str, { filename: path, pretty: true });

      getQuery(req.getParams)
      .then(function(hit){
        return mapHitToAction(hit);
      })
      .then(function(action){
        res.send(fn(action));
      })
      .catch(function(error){
        catchError(res, error);
      });

    }
  ]);

  // REGISTER OUR ROUTES -------------------------------
  // all of our routes will be prefixed with /api/v1
  app.use('/', rootRouter);
  app.use('/preview/actions', previewActionsRouter);

  // START THE SERVER
  // =============================================================================
  var server = app.listen(port, function(){
    var _host = server.address().address;
    var _port = server.address().port;
    console.log('Listening at http://%s:%s', _host, _port);
  });
})();
