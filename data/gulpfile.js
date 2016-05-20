var gulp = require('gulp');
var through = require('through2');
var moment = require('moment');

var dbHost = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
var dbPort = process.env.DB_PORT_9200_TCP_PORT || 9200

var esHelpers = require('./es-helpers')({
  host: dbHost + ':' + dbPort,
  requestTimeout: 50000
});

var par_1_0 = require('./par_1_0')(esHelpers);
var par_1_1 = require('./par_1_1')(esHelpers);

// moment.locale('fr');

gulp.task('ping', function(){
  return esHelpers.ping({
    requestTimeout: 30000,
    hello: "elasticsearch"
  }).then(function(pong) {
    console.info('Succès de connexion ElasticSearch');
  }).catch(function(err) {
    console.error('Echec de connexion ElasticSearch', err);
  });
});

/*
Tâches de reprise de données
*/

gulp.task('delete_1_0', ['ping'], function() {

  return par_1_0.deleteIndex();

});

gulp.task('create_1_0', ['ping', 'delete_1_0'], function() {
  return par_1_0.createIndex();
});

gulp.task('recover_regions_1_0', ['create_1_0'], function() {
  return par_1_0.recoverRegions();
});

gulp.task('recover_actions_before_2014', ['create_1_0'], function() {
  return par_1_0.recoverActionsBefore2014();
});

gulp.task('recover_actions_starting_2014', ['create_1_0'], function() {
  return par_1_0.recoverActionsStarting2014();
});

gulp.task('recover_1_0', ['recover_regions_1_0', 'recover_actions_before_2014', 'recover_actions_starting_2014']);

/*
Tâches de migration d'un index source vers un index cible
*/

gulp.task('delete_1_1', ['ping'], function() {
  return par_1_1.deleteIndex();
});

gulp.task('create_1_1', ['ping', 'delete_1_1'], function() {
  return par_1_1.createIndex();
});

gulp.task('migrate_regions_1_0_to_1_1', function() {
  return par_1_1.migrationRegions(par_1_0.scrollRegions());
});



gulp.task('from_1_0_to_1_1', ['ping', 'create_1_1', 'migrate_1_0_to_1_1', 'alias_1_0_to_1_1', 'delete_1_0'], function(cb){
  console.info('from_1_0_to_1_1 done');
});

gulp.task('default', function(){
});
