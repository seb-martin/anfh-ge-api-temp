'use strict';

var url = require('url');

var ParamsBuilder = require('./es-params-builder')
var DAO = require('./es-dao')
var bindings = require('./PAR-bindings');
var typologies = require('./PAR-typologies');

var index = 'par';

var hitToRegion = function(dao, hit) {
  return hit._source;
}

var hitToAxe = function(dao, hit) {
  var axe = hit._source;
  axe.id = hit._id;
  return axe;
}

var hitToAction = function(dao, hit) {
  var action = hit._source;

  // Les actions non publiées ne doivent pas être retournées
  if (!action._publie) {
    return null;
  }

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
    var getParams = new ParamsBuilder('par', 'axes', bindings['axes'])
      .id(action.axe)
      .build();

    p = dao.get(getParams, hitToAxe)
      .then(function(axe) {
        delete axe.region;
        delete axe.exercice;
        delete axe.derniereModif;

        action.axe = axe;

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


module.exports.parRegionsGET = function parRegionsGET (req, res, next) {
  var type = 'regions';

  var args = req.swagger.params;

  var searchParams =  new ParamsBuilder(index, type, bindings[type])
    .searchParams(args)
    .must_not('code', 'NAT')
    .build();

  var dao = new DAO(req.esClient);

  dao.search(searchParams, hitToRegion).then(function(regionCollection) {
    res.json(regionCollection);
  }).catch(function(err) {
    next(err);
  });
};

module.exports.parRegionsCodeGET = function parRegionsCodeGET (req, res, next) {

  if (req.swagger.params.id.value === 'NAT') {
    next({
      status: 404,
      message: 'Not Found'
    });
  } else {
    var type = 'regions';

    var getParams = new ParamsBuilder(index, type, bindings[type])
      .getParams(req.swagger.params)
      .build();

    var dao = new DAO(req.esClient);

    dao.get(getParams, hitToRegion).then(function(region) {
      res.json(region);
    }).catch(function(err) {
      next(err);
    });
  }
};


module.exports.parAxesGET = function parAxesGET (req, res, next) {
  var type = 'axes';

  var args = req.swagger.params;

  var searchParams =  new ParamsBuilder(index, type, bindings[type])
    .searchParams(args)
    .must_not('region', 'NAT')
    .build();

  var dao = new DAO(req.esClient);

  dao.search(searchParams, hitToAxe).then(function(axeCollection) {
    res.json(axeCollection);
  }).catch(function(err) {
    next(err);
  });
};

module.exports.parAxesIdGET = function parAxesIdGET (req, res, next) {
  var type = 'axes';

  var getParams = new ParamsBuilder(index, type, bindings[type])
    .getParams(req.swagger.params)
    .build();

  var dao = new DAO(req.esClient);

  dao.get(getParams, hitToAxe).then(function(axe) {
    if (axe.region === 'NAT') {
      next({
        status: 404,
        message: 'Not Found'
      });
    } else {
      res.json(axe);
    }
  }).catch(function(err) {
    next(err);
  });
};


module.exports.parActionsGET = function parActionsGET (req, res, next) {
  var type = 'actions';

  var args = req.swagger.params;

  var searchParams =  new ParamsBuilder(index, type, bindings[type])
    .searchParams(args)
    .must_not('region', 'NAT')
    .filter('_publie', true)
    .build();

  var dao = new DAO(req.esClient);

  dao.search(searchParams, hitToAction).then(function(actionCollection) {
    res.json(actionCollection);
  }).catch(function(err) {
    next(err);
  });
};

module.exports.parActionsIdGET = function parActionsIdGET (req, res, next) {
  var type = 'actions';

  var getParams = new ParamsBuilder(index, type, bindings[type])
    .getParams(req.swagger.params)
    .build();

  var dao = new DAO(req.esClient);

  dao.get(getParams, hitToAction).then(function(action) {
    if (action) {
      if (action.region === 'NAT') {
        next({
          status: 404,
          message: 'Not Found'
        });
      } else {
        res.json(action);
      }
    } else {
      res.status(404);
      throw "Non trouvé";
    }
  }).catch(function(err) {
    next(err);
  });
};
