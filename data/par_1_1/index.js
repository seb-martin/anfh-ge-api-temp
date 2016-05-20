
var through = require('through2');
var gulp = require('gulp');
var moment = require('moment');

var esHelpers = require('../es-helpers');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {

  gulp.task('migrate_1_0_to_1_1', function(cb) {
    var prevIndex = 'par_1_0';
    var nextIndex = 'par_1_1';

    esHelpers.searchNbulk(prevIndex, nextIndex, 'regions').then(function() {
      return searchNbulk(prevIndex, nextIndex, 'axes')
    }).then(function() {
      return searchNbulk(prevIndex, nextIndex, 'actions')
    }).then(function() {
      cb();
    }).catch(function(err) {
      console.error(err);
      cb(err);
    });

  });

  gulp.task('alias_1_0_to_1_1', function(cb) {
    esHelpers.deleteAlias('par_0_1').then(function() {
      return createAlias('par_1_1');
    }).then(function() {
      cb();
    }).catch(function(err) {
      console.error(err);
      cb(err);
    });
  });

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

    addDerniereModif: function() {
      return through.obj(function(obj, enc, cb) {
        var ts = moment().toISOString();
        obj.derniereModif = ts;
        this.push(obj);
        cb();
      });
    },
    regionsBulk: function() {
      return esHelpers.bulker({
        action: function(region) {
          return {'index': {'_index': INDEX_1_1, '_type': 'regions', '_id': region.code}}
        }
      }).on('end', function() {
        console.info('Succès de la migration des régions sur l\'index', INDEX_1_1);
      })
      .on('error', function(err) {
        console.error('Echec de la migration des régions sur l\'index', INDEX_1_1, err);
      });
    }  }
};
