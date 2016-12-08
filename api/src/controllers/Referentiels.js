'use strict';

var url = require('url');

var ParamsBuilder = require('./es-params-builder')
var DAO = require('./es-dao')
var bindings = require('./Referentiels-bindings');

var index = 'anfh';

var hitToCentre = function(dao, hit) {
  return hit._source;
}

module.exports.anfhCentresbcGET = function anfhCentresbcGET (req, res, next) {

  var type = 'centresbc';

  var args = req.swagger.params;

  var searchParams =  new ParamsBuilder(index, type, bindings[type])
    .searchParams(args)
    .build();

  var dao = new DAO(req.esClient);

  dao.search(searchParams, hitToCentre).then(function(centreCollection) {
    res.json(centreCollection);
  }).catch(function(err) {
    next(err);
  });

};

module.exports.anfhCentresbcIdGET = function anfhCentresbcIdGET (req, res, next) {
  var type = 'centresbc';

  var getParams = new ParamsBuilder(index, type, bindings[type])
    .getParams(req.swagger.params)
    .build();

  var dao = new DAO(req.esClient);

  dao.get(getParams, hitToCentre).then(function(centrebc) {
    res.json(centrebc);
  }).catch(function(err) {
    next(err);
  });

};
