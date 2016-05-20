
var through = require('through2');
var gulp = require('gulp');
var moment = require('moment');

var esHelpers = require('../es-helpers');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {
  var docModif = function() {
    return through.obj(function(obj, enc, cb) {
      obj._index = INDEX_1_1;
      obj.derniereModif = moment().toISOString();;
      this.push(obj);
      cb();
    });
  };

  var regionsBulk = function() {
    return esHelpers.bulker()
      .on('end', function() {
        console.info('Succès de la migration des régions sur l\'index', INDEX_1_1);
      })
      .on('error', function(err) {
        console.error('Echec de la migration des régions sur l\'index', INDEX_1_1, err);
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
      return regionsStream
        .pipe(docModif())
        .pipe(regionsBulk());
    }
  }
};
