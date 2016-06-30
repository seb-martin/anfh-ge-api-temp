(function() {
  'use strict';

  var express = require('express');
  var nodeExcel = require('excel-export');
  var fs = require('fs');
  var xlsConf = require('./xlsConf');

  var catchError = function(res, error){
    console.trace(error.message);
    res.status(error.status).json({
      status: error.status,
      message: error.message
    });
  };

  var searchAxeHits = function(req, res, next) {
    req.esClient.search({
      index: 'par',
      type: 'axes',
      from: 0,
      size: 100,
      body: {
        query: {
          bool: {
            filter: [
              {
                term: { region: req.params.reg }
              },
              {
                term: { exercice: req.params.exe }
              },
            ]
          }
        }
      }
    }).then(function(searchResult) {
      req.axesSearchResult = searchResult;
      next();
    }).catch(function(error){
      catchError(res, error);
    });
  };

  var axesSearchResultToMap = function(req, res, next) {
    req.axesMap = req.axesSearchResult.hits.hits.reduce(function(map, hit) {
      map[hit._id] = {
        num: hit._source.num,
        intitule: hit._source.intitule
      };
      return map;
    }, {});

    next();
  };

  var searchActionHits = function(req, res, next) {
    req.esClient.search({
      index: 'par',
      type: 'actions',
      from: 0,
      size: 300,
      body: {
        query: {
          bool: {
            filter: [
              {
                term: { _publie: true }
              },
              {
                term: { region: req.params.reg }
              },
              {
                term: { exercice: req.params.exe }
              },
            ]
          }
        }
      }
    }).then(function(searchResult) {
      req.actionsSearchResult = searchResult;
      next();
    }).catch(function(error){
      catchError(res, error);
    });
  };

  var actionsSearchResultToRows = function(req, res, next) {

    var flatten = function(source) {
      var flat = [source.region, source.exercice];

      // Axe
      if (source.axe) {
        var axe = req.axesMap[source.axe];
        flat.push(axe.num);
        flat.push(axe.intitule);
      } else {
        flat.push(null);
        flat.push(null);
      }

      // intitule
      flat.push(source.intitule);

      // Nature
      switch (source.nature) {
        case 'N':
          flat.push('AFN');
          break;
        case 'R':
          flat.push('AFR');
          break;
        case 'C':
          flat.push('AFC');
          break;
        default:
          flat.push(null);
      }

      return flat;
    };


    req.rows = req.actionsSearchResult.hits.hits.reduce(function(arr, hit) {
      if (hit._source.modules && hit._source.modules.length > 0) {
        hit._source.modules.forEach(function(module) {
          var flat = flatten(hit._source);
          flat.push(module.num);
          flat.push(module.intitule);

          arr.push(flat);
        });

      } else {
        var flat = flatten(hit._source);
        flat.push(null);
        flat.push(null);

        arr.push(flat);
      }

      return arr;
    }, []).sort(function(a1, a2) {
      var val;

      // Compare le code région
      val = a1[0].localeCompare(a2[0]);
      if (val !== 0) {
        return val;
      }

      // Compare l'exercice
      val = a1[1] - a2[1]
      if (val !== 0) {
        return val;
      }

      // Compare le numéro d'axe
      val = a1[2] - a2[2]
      if (val !== 0) {
        return val;
      }

      // Compare l'intitulé de l'action
      val = a1[4].localeCompare(a2[4]);
      if (val !== 0) {
        return val;
      }

      // Compare le numéro de module
      val = a1[6] - a2[6]
      if (val !== 0) {
        return val;
      }

      // a1 et a2 équivalent
      return 0;
    });

    next();

  };

  var rowsToXlsBin = function(req, res, next) {
    xlsConf.rows = req.rows;
    req.xlsBin = nodeExcel.execute(xlsConf);

    next();
  };

  var sendResponse = function(req, res) {
    var fileName = 'cdf-' + req.params.reg.toLowerCase() + '-' + req.params.exe + '-au-' + (new Date().toISOString().substr(0, 10)) + '.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  	res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
  	res.end(req.xlsBin, 'binary');
  };

  var cdfRouter = express.Router();

  cdfRouter.get('/:reg/:exe', [
    searchAxeHits,
    axesSearchResultToMap,
    searchActionHits,
    actionsSearchResultToRows,
    rowsToXlsBin,
    sendResponse
  ]);


  module.exports = cdfRouter;

})();
