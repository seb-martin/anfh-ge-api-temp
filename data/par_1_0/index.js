
var through = require('through2');
var gulp = require('gulp');
var esHelpers = require('../es-helpers');

var INDEX_1_0 = 'par_1_0';


var deleteMapping = function() {
  return esHelpers.deleteMapping(INDEX_1_0);
}

var regions = function() {
  return through.obj(function(file, enc, cb) {
    var regions = JSON.parse(file.contents);
    var bulkArr = [];
    regions.forEach(function(r) {
      bulkArr.push({'index': {'_index': INDEX_1_0, '_type': 'regions', '_id': r.code}});

      bulkArr.push(r);
    });
    this.push(bulkArr);
    cb();

  });
};

var actionsBefore2014 = function() {
  return require('./actions/recovery-before-2014')(INDEX_1_0);
};

var actionsStarting2014 = function() {
  return require('./actions/recovery-starting-2014')(INDEX_1_0);
};

gulp.task('delete_1_0', ['ping'], deleteMapping);


module.exports = function() {

  gulp.task('create_1_0', ['ping', 'delete_1_0'], function() {
    return gulp.src('par_1_0/par_1_0.json')
      .pipe(esHelpers.createMapping(INDEX_1_0));
  });


  gulp.task('recover_regions_1_0', ['create_1_0'], function() {

    return gulp.src('par_1_0/regions/regions.json')
      .pipe(regions())
      .pipe(esHelpers.bulk());
  });

  gulp.task('recover_actions_before_2014', ['create_1_0'], function() {
    return gulp.src('par_1_0/actions/offres_formations_avant_2014.xml')
      .pipe(actionsBefore2014())
      .pipe(esHelpers.bulk());
  });

  gulp.task('recover_actions_starting_2014', ['create_1_0'], function() {
    return gulp.src('par_1_0/actions/offres_formations_apartirde_2014.xml')
      .pipe(actionsStarting2014())
      .pipe(esHelpers.bulk());
  });

  return {
    deleteMapping: deleteMapping
  };

};
