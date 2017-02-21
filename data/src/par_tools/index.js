var through = require('through2');
var moment = require('moment');

var INDEX_1_1 = 'par_1_1';

module.exports = function(esHelpers) {
  var setDateDerniereModif = function() {
    return through.obj(function(obj, enc, cb) {
      obj.derniereModif = moment().toISOString();

      this.push(obj);

      cb();
    });
  };

  var upDateDerniereModif = function(docsStream) {
    return docsStream
      .pipe(setDateDerniereModif())
      .pipe(esHelpers.bulker())
        .on('end', function() {
          console.info('Succès de la mise à jour de la date de dernère modif des actions sur l\'index', INDEX_1_1);
        })
        .on('error', function(err) {
          console.info('Echec de la mise à jour de la date de dernère modif des actions sur l\'index', INDEX_1_1);
        });

  };

  return {
    upDateDerniereModif: function(stream) {
      return upDateDerniereModif(stream);
    }

  };

}
