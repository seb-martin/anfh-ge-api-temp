(function(){
  'use strict'

  // call the packages we need
  var express       = require('express');        // call express
  var app           = express();                 // define our app using express
  var bodyParser    = require('body-parser');
  var elasticsearch = require('elasticsearch');

  var port          = process.env.API_PORT_80_TCP_PORT || 80;        // set our port
  var dbHost        = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
  var dbPort        = process.env.DB_PORT_9200_TCP_PORT || 9200
  var client        = new elasticsearch.Client({
    host: 'host:port'.replace('host', dbHost).replace('port', dbPort)
    // , log: 'trace'
  });

  // configure app to use bodyParser()
  // this will let us get the data from a POST
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

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

  // ROUTES FOR OUR API
  // =============================================================================
  var router = express.Router();              // get an instance of the express Router


  var resultToCollection = function(searchResult, bindId){
    return {
      "total":searchResult.hits.total,
      "items": searchResult.hits.hits.map(function(hit) {
        var instance = hit._source;
        if (bindId) {
          instance.id = hit._id;
        }
        return instance;

      })
    };
  };

  var resultToInstance = function(searchResult, bindId){
    var instance = searchResult._source;
    if (bindId) {
      instance.id = searchResult._id;
    }
    return instance;
  }

  var catchError = function(res, error){
    console.trace(error.message);
    res.status(error.status).json({
      status: error.status,
      message: error.message
    });
  };

  var prepareSearchParams = function(req, res, next){
    req.searchParams = {
      body: {
        query: {
          bool: {
          }
        }
      }
    };

    if(req.query.offset){
      req.searchParams.from = req.query.offset;
    }

    if(req.query.limit){
      req.searchParams.size = req.query.limit;
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

  var buildFilterParams = function(req, fields){

    return fields.map(function(field) {
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
  }

  var buildSortParams = function(req, fields){
    var sortParams;

    if(req.query.sortedBy){

      return req.query.sortedBy.split(',').map(function(field) {
        return field.trim();
      }).map(function(signedfield) {
        var order , field;
        var result = {};

        if(signedfield.slice(0, 1) === '-'){
          order = 'desc';
          field = signedfield.slice(1, signedfield.length);
        } else {
          order = 'asc';
          field = signedfield;
        }

        if (fields.indexOf(field) >= 0) {
          result[field] = {order: order};

          return result;
        } else {
          return null;
        }

      }).filter(function(p) {
        // Retire les valeurs null
        return p;
      });

    } else {
      return [];
    }
  }

  var searchRegions = function(req, res){
    var fields = ['code', 'denomination'];
    var i, term;

    req.searchParams.index = 'par';
    req.searchParams.type = 'regions';
    req.searchParams.body.query.bool.filter = buildFilterParams(req, fields);
    req.searchParams.body.sort = buildSortParams(req, fields);

    client.search(req.searchParams)
    .then(function(searchResult){
      return resultToCollection(searchResult);
    })
    .then(function(regions){
      res.json(regions);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getRegion = function(req, res){
    client.get({
      index: 'par',
      type: 'regions',
      id: req.params.code
    })
    .then(function(searchResult){
      return resultToInstance(searchResult);
    })
    .then(function(region){
      res.json(region);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  var searchAxes = function(req, res){
    var fields = ['region', 'exercice', 'num', 'intitule'];

    req.searchParams.index = 'par';
    req.searchParams.type = 'axes';
    req.searchParams.body.query.bool.filter = buildFilterParams(req, fields);
    req.searchParams.body.sort = buildSortParams(req, fields);

    client.search(req.searchParams)
    .then(function(searchResult){
      return resultToCollection(searchResult, true);
    })
    .then(function(axes){
      res.json(axes);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getAxe = function(req, res){
    client.get({
      index: 'par',
      type: 'axes',
      id: req.params.id
    })
    .then(function(searchResult){
      return resultToInstance(searchResult, true);
    })
    .then(function(region){
      res.json(region);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  var searchActions = function(req, res){
    var fields = ['region', 'exercice', 'axe', 'typologie'];

    req.searchParams.index = 'par';
    req.searchParams.type = 'actions';
    req.searchParams.body.query.bool.filter = buildFilterParams(req, fields);
    req.searchParams.body.sort = buildSortParams(req, fields);

    client.search(req.searchParams)
    .then(function(searchResult){
      return resultToCollection(searchResult, true);
    })
    .then(function(axes){
      res.json(axes);
    })
    .catch(function(error){
      catchError(res, error);
    });

  };

  var getAction = function(req, res){
    client.get({
      index: 'par',
      type: 'actions',
      id: req.params.id
    })
    .then(function(searchResult){
      return resultToInstance(searchResult, true);
    })
    .then(function(region){
      res.json(region);
    })
    .catch(function(error){
      catchError(res, error);
    });
  };

  // Routes

  router.get('/par/regions', [prepareSearchParams, searchRegions]);
  router.get('/par/regions/:code', [getRegion]);

  router.get('/par/axes', [prepareSearchParams, searchAxes]);
  router.get('/par/axes/:id', [getAxe]);

  router.get('/par/actions', [prepareSearchParams, searchActions]);
  router.get('/par/actions/:id', [getAction]);

  // {
  //   "query": {
  //       "query_string": {
  //             "query": "*al*"
  //         }}
  // }

  // {
  //   "query": {
  //   "bool": {
  //       "must": [
  //         { "match": { "_all": "alp" }}
  //       ]
  //     }
  //   }
  // }


//   {
//   "query": {
//       "bool":{
//           "filter": {
//               "match" : { "region" : "ALP" }
//           }
//       }
//
//   }
// }

// {
//   "query":{
//       "bool": {
//           "must": [{
//               "query_string" : {"query":"*"}
//           }],
//           "should":[],
//           "must_not":[],
//           "filter": [
//               {
//                 "term" : { "region" : "ALP" }
//               },
//               {
//                 "term" : { "exercice" : "2015" }
//               }
//           ]
//       }
//
//
//   },
//   "sort": {"code": {"order": "asc"}}
//
// }


  // more routes for our API will happen here

  // REGISTER OUR ROUTES -------------------------------
  // all of our routes will be prefixed with /api/v1
  app.use('/api/v1', router);

  // START THE SERVER
  // =============================================================================
  var server = app.listen(port, function(){
    var _host = server.address().address;
    var _port = server.address().port;
    console.log('Listening at http://%s:%s', _host, _port);
  });
})();
