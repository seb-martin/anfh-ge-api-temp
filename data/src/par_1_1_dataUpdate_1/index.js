var through = require('through2');
var gulp = require('gulp');
var moment = require('moment');

var esHelpers = require('../es-helpers');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {

  var docActionModif = function() {
    return through.obj(function(obj, enc, cb) {
      var modified = false;
      if (obj.modules) {
        obj.modules.forEach(function(module) {
          var dureeISO = module.duree;
          if (dureeISO) {
            var oldDuration = moment.duration(dureeISO);
            var newDuration =  moment.duration({
              hours: oldDuration.days() * 7 + oldDuration.hours(),
              minutes: oldDuration.minutes()
            });
            module.duree = newDuration.toISOString();
            modified = true;
          }
        });

      }

      if (modified) {
        obj.derniereModif = moment().toISOString();
      }
      this.push(obj);
      cb();
    });
  };

  var updateAction = function(docsStream, docType) {
    return docsStream
      .pipe(docActionModif())
      .pipe(esHelpers.bulker())
        .on('end', function() {
          console.info('Succès de la mise à jour des documents DOCTYPE sur l\'index'.replace('DOCTYPE', docType), INDEX_1_1);
        })
        .on('error', function(err) {
          console.info('Echec de la mise à jour des documents DOCTYPE sur l\'index'.replace('DOCTYPE', docType), INDEX_1_1);
        });

  };

  return {
    updateActions: function(actionsStream) {
      return updateAction(actionsStream, 'actions');
    }
  }

};
