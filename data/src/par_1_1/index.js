
var through = require('through2');
var gulp = require('gulp');
var moment = require('moment');

var esHelpers = require('../es-helpers');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {

  var docModif = function() {
    return through.obj(function(obj, enc, cb) {
      obj._index = INDEX_1_1;
      obj.derniereModif = moment().toISOString();
      this.push(obj);
      cb();
    });
  };

  var migration = function(docsStream, docType) {
    return docsStream
      .pipe(docModif())
      .pipe(esHelpers.bulker())
        .on('end', function() {
          console.info('Succès de la migration des documents DOCTYPE sur l\'index'.replace('DOCTYPE', docType), INDEX_1_1);
        })
        .on('error', function(err) {
          console.info('Echec de la migration des documents DOCTYPE sur l\'index'.replace('DOCTYPE', docType), INDEX_1_1);
        });

  };

  return {
    deleteIndex: function() {
      return esHelpers.deleteIndex({index: INDEX_1_1, ignore: 404})
        .then(function(response) {
          // Si la réponse contient une erreur (404), on la notifie
          var alerte = response.error ? '(L\'index n\'existait pas)' : '';

          console.info('Succès de suppresssion de l\'index', INDEX_1_1, alerte);
        }).catch(function(err) {
          console.error('Echec de suppresssion de l\'index', INDEX_1_1, JSON.stringify(err));
        });
    },

    createIndex: function() {
      var mapping = require('./par_1_1.json');
      return esHelpers.createIndex({
        index: INDEX_1_1,
        body: mapping
      }).then(function(response) {
        console.info('Succès de création de l\'index', INDEX_1_1);
      }).catch(function(err) {
        console.error('Echec de création de l\'index', INDEX_1_1, JSON.stringify(mapping), err);
      });
    },

    migrationRegions: function(regionsStream) {
      return migration(regionsStream, 'regions');
    },

    migrationAxes: function(axesStream) {
      return migration(axesStream, 'axes');
    },

    migrationActions: function(actionsStream) {
      return migration(actionsStream, 'actions');
    },

    createAlias: function(alias) {
      return esHelpers.createAlias({index: INDEX_1_1, name: alias})
        .then(function(response) {
          console.info('Succès de création de l\'alias', alias, 'vers l\'index', INDEX_1_1);
        }).catch(function(err) {
          console.error('Echec de création de l\'alias', alias, 'vers l\'index', INDEX_1_0, err);
        });
    },

    deleteAlias: function(alias) {
      return esHelpers.deleteAlias({index: INDEX_1_1, name: alias})
        .then(function(response) {
          console.info('Succès de suppression de l\'alias', alias, 'vers l\'index', INDEX_1_1);
        }).catch(function(err) {
          console.error('Echec de suppression de l\'alias', alias, 'vers l\'index', INDEX_1_1, err);
        });
    },

    scrollActions: function() {
      return esHelpers.scroller({
        index: INDEX_1_1,
        type: 'actions',
        scroll: '5s',
        size: 5
      });
    }
  }

};
