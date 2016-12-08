var gulp = require('gulp');
var through = require('through2');
var moment = require('moment');

var dbHost = process.env.DB_PORT_9300_TCP_ADDR || 'localhost';
var dbPort = process.env.DB_PORT_9200_TCP_PORT || 9200

var esHelpers = require('./es-helpers')({
  host: dbHost + ':' + dbPort,
  requestTimeout: 50000//, log: 'trace'
});

var par_1_0 = require('./par_1_0')(esHelpers);
var par_1_1 = require('./par_1_1')(esHelpers);
var anfh_1_0 = require('./anfh_1_0')(esHelpers);
var par_1_1_dataUpdate_1 = require('./par_1_1_dataUpdate_1')(esHelpers);

var PAR_ALIAS_NAME = 'par';
var ANFH_ALIAS_NAME = 'anfh';

// moment.locale('fr');

gulp.task('ping', function(){
  return esHelpers.ping({
    requestTimeout: 30000,
  }).then(function(pong) {
    console.info('Succès de connexion ElasticSearch');
  }).catch(function(err) {
    console.error('Echec de connexion ElasticSearch', err);
  });
});

/*
Tâches du mapping par 1.0 (reprise de données)
*/

gulp.task('delete_par_1_0', ['ping'], function() {

  return par_1_0.deleteIndex();

});

gulp.task('create_par_1_0', ['ping', 'delete_par_1_0'], function() {
  return par_1_0.createIndex();
});

gulp.task('recover_par_regions_1_0', ['create_par_1_0'], function() {
  return par_1_0.recoverRegions();
});

gulp.task('recover_par_actions_before_2014', ['create_par_1_0'], function() {
  return par_1_0.recoverActionsBefore2014();
});

gulp.task('recover_par_actions_starting_2014', ['create_par_1_0'], function() {
  return par_1_0.recoverActionsStarting2014();
});

gulp.task('create_alias_par_1_0', [
  'recover_par_regions_1_0',
  'recover_par_actions_before_2014',
  'recover_par_actions_starting_2014'
], function() {
  return par_1_0.createAlias(PAR_ALIAS_NAME);
});

gulp.task('delete_alias_par_1_0', function() {
  return par_1_0.deleteAlias(PAR_ALIAS_NAME);
});

gulp.task('recover_par_1_0', [
  'recover_par_regions_1_0',
  'recover_par_actions_before_2014',
  'recover_par_actions_starting_2014',
  'create_alias_par_1_0'
]);

/*
Tâches du mapping par 1.1 (migration depuis 1.0)
*/

gulp.task('delete_par_1_1', ['ping'], function() {
  return par_1_1.deleteIndex();
});

gulp.task('create_par_1_1', ['ping', 'delete_par_1_1'], function() {
  return par_1_1.createIndex();
});

gulp.task('migrate_par_regions_1_0_to_1_1', ['create_par_1_1'], function() {
  return par_1_1.migrationRegions(par_1_0.scrollRegions());
});

gulp.task('migrate_par_axes_1_0_to_1_1', ['create_par_1_1'], function() {
  return par_1_1.migrationAxes(par_1_0.scrollAxes());
});

gulp.task('migrate_par_actions_1_0_to_1_1', ['create_par_1_1'], function() {
  return par_1_1.migrationActions(par_1_0.scrollActions());
});

gulp.task('create_alias_par_1_1', [
  'migrate_par_regions_1_0_to_1_1',
  'migrate_par_axes_1_0_to_1_1',
  'migrate_par_actions_1_0_to_1_1'
], function() {
  return par_1_0.deleteAlias(PAR_ALIAS_NAME)
    .then(function() {
      return par_1_1.createAlias(PAR_ALIAS_NAME);
    });
});

gulp.task('delete_alias_par_1_1', function() {
  return par_1_1.deleteAlias(PAR_ALIAS_NAME);
});

gulp.task('from_par_1_0_to_1_1', [
  'migrate_par_regions_1_0_to_1_1',
  'migrate_par_axes_1_0_to_1_1',
  'migrate_par_actions_1_0_to_1_1',
  'create_alias_par_1_1'
]);

/*
Tâches du mapping anfh 1.0 (reprise de données)
*/

gulp.task('delete_anfh_1_0', ['ping'], function() {

  return anfh_1_0.deleteIndex();

});

gulp.task('create_anfh_1_0', ['ping', 'delete_anfh_1_0'], function() {
  return anfh_1_0.createIndex();
});

gulp.task('recover_anfh_centresbc_1_0', ['create_anfh_1_0'], function() {
  return anfh_1_0.recoverCentresBC();
});

gulp.task('create_alias_anfh_1_0', [
  'recover_anfh_centresbc_1_0',
], function() {
  return anfh_1_0.createAlias(ANFH_ALIAS_NAME);
});

gulp.task('delete_alias_anfh_1_0', function() {
  return anfh_1_0.deleteAlias(ANFH_ALIAS_NAME);
});

gulp.task('recover_anfh_1_0', [
  'recover_anfh_centresbc_1_0',
  'create_alias_anfh_1_0'
]);

/*
Tâches de mise à jour 1 des données du mapping 1.1 (durées exprimées en heures et en minutes, pas en jours)
*/

gulp.task('update_1_par_1_1', function() {
  return par_1_1_dataUpdate_1.updateActions(par_1_1.scrollActions());
});


/*
Tâche par défaut (denière tâche majeure de manip des données)
*/

gulp.task('default', ['update_1_par_1_1']);
