
var through = require('through2');
var gulp = require('gulp');
var esHelpers = require('../es-helpers');

var INDEX_1_1 = 'par_1_1';

var deleteMapping = function() {
  return esHelpers.deleteMapping(INDEX_1_1);
}

gulp.task('delete_1_1', ['ping'], deleteMapping);

gulp.task('create_1_1', ['ping', 'delete_1_1'], function() {
  return gulp.src('par_1_1/par_1_1.json')
    .pipe(esHelpers.createMapping(INDEX_1_1));
});


module.exports = function() {

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

};
