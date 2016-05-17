var gulp = require('gulp');
var through = require('through2');
var moment = require('moment');

var esHelpers = require('./es-helpers');
var par_1_0 = require('./par_1_0')();
var par_1_1 = require('./par_1_1')();

// moment.locale('fr');

gulp.task('ping', function(){
  return esHelpers.ping({
    requestTimeout: 30000,
    hello: "elasticsearch"
  }).on('pong', function(pong) {
    console.info('Succès de connexion ElasticSearch');
  }).on('error', function(err) {
    console.error('Echec de connexion ElasticSearch', err);
  // }).on('end', function() {
  //   console.info('end');
  });
});

/*
Tâches de reprise de données
*/

gulp.task('recover_1_0', ['recover_regions_1_0', 'recover_actions_before_2014', 'recover_actions_starting_2014'], function() {
  console.info('Reprise des données dans l\'index par_1_0 terminée');
});

/*
Tâches de migration d'un index source vers un index cible
*/

gulp.task('from_1_0_to_1_1', ['ping', 'create_1_1', 'migrate_1_0_to_1_1', 'alias_1_0_to_1_1', 'delete_1_0'], function(cb){
  console.info('from_1_0_to_1_1 done');
});

gulp.task('default', function(){
  var readable = esHelpers.scroller('par_1_0', 'regions');

  readable.pipe(esHelpers.sources())
  .pipe(through.obj(function(sources, enc, cb) {

    this.push(
      sources.map(function(source) {
        source.derniereModif = moment().toISOString();
        return source;
      })
    );
    cb();
  })).pipe(through.obj(function(regions, enc, cb) {
    var bulkArr = [];

    regions.forEach(function (region) {
      bulkArr.push({'index': {'_index': 'par_1_1', '_type': 'regions', '_id': region.code}});

      bulkArr.push(region);
    });

    this.push(bulkArr);
    cb();
  })).pipe(esHelpers.bulk('par_1_1'));

  return readable;

});
