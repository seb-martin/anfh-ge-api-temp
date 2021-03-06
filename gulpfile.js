(function(){

  var gulp = require('gulp');
  var bump = require('gulp-bump');
  var filter = require('gulp-filter');
  var git = require('gulp-git');
  var tag_version = require('gulp-tag-version');
  var argv = require('minimist')(process.argv.slice(2));

  var paths = {
    versionToBump: {
      project: {
        src: ['./package.json'],
        dst: './'
      },
      api: {
        src: ['./api/src/package.json'],
        dst: './api/src'
      },
      views: {
        src: ['./views/src/package.json'],
        dst: './views/src'
      },
      ui: {
        src: ['./ui/package.json'],
        dst: './ui'
      },
      admin: {
        src: ['./admin/src/package.json'],
        dst: './admin/src'
      },
      data: {
        src: ['./data/src/package.json'],
        dst: './data/src'
      }
    },
    versionToCheck: 'package.json'
  };

  var ver = function(subproject, semver) {

    // get all the files to bump version in
    return gulp.src(subproject.src)
        // bump the version number in those files
        .pipe(bump({version: semver}))
        // save it back to filesystem
        .pipe(gulp.dest(subproject.dst));
  };

  var inc = function(subproject, importance) {

    return gulp.src(subproject.src)
        // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest(subproject.dst));
  };

  // Commit subtask

  gulp.task('commit', function(){
    // Construit un tableau comprenant toutes les src
    var src = Object.getOwnPropertyNames(paths.versionToBump).map(function(name) {
      return paths.versionToBump[name].src;
    }).reduce(function(mem, arr) {
    	Array.prototype.push.apply(mem, arr);
    	return mem;
    }, []);


    // read only one reference file to get the version number
    return gulp.src(src)
        // commit the changed version number
        .pipe(git.commit('bumps package version'));
  });

  // Version subtasks

  gulp.task('check-version-arg', function(){
    if (!argv.version) {
      throw 'Numéro de version absent. Tapez `gulp` pour voir les usages';
    }
  });

  gulp.task('bump-project-version', function(){
    return ver(paths.versionToBump.project, argv.version);
  });

  gulp.task('bump-api-version', function(){
    return ver(paths.versionToBump.api, argv.version);
  });

  gulp.task('bump-views-version', function(){
    return ver(paths.versionToBump.views, argv.version);
  });

  gulp.task('bump-ui-version', function(){
    return ver(paths.versionToBump.ui, argv.version);
  });

  gulp.task('bump-admin-version', function(){
    return ver(paths.versionToBump.admin, argv.version);
  });

  gulp.task('bump-data-version', function(){
    return ver(paths.versionToBump.data, argv.version);
  });

  // Major subtasks

  gulp.task('bump-project-major', [], function() {
    return inc(paths.versionToBump.project, 'major');
  });

  gulp.task('bump-api-major', [], function() {
    return inc(paths.versionToBump.api, 'major');
  });

  gulp.task('bump-views-major', [], function() {
    return inc(paths.versionToBump.views, 'major');
  });

  gulp.task('bump-ui-major', [], function() {
    return inc(paths.versionToBump.ui, 'major');
  });

  gulp.task('bump-admin-major', [], function() {
    return inc(paths.versionToBump.admin, 'major');
  });

  gulp.task('bump-data-major', [], function() {
    return inc(paths.versionToBump.data, 'major');
  });

  // Minor subtasks

  gulp.task('bump-project-minor', [], function() {
    return inc(paths.versionToBump.project, 'minor');
  });

  gulp.task('bump-api-minor', [], function() {
    return inc(paths.versionToBump.api, 'minor');
  });

  gulp.task('bump-views-minor', [], function() {
    return inc(paths.versionToBump.views, 'minor');
  });

  gulp.task('bump-ui-minor', [], function() {
    return inc(paths.versionToBump.ui, 'minor');
  });

  gulp.task('bump-admin-minor', [], function() {
    return inc(paths.versionToBump.admin, 'minor');
  });

  gulp.task('bump-data-minor', [], function() {
    return inc(paths.versionToBump.data, 'minor');
  });

  // Patch subtasks

  gulp.task('bump-project-patch', [], function() {
    return inc(paths.versionToBump.project, 'patch');
  });

  gulp.task('bump-api-patch', [], function() {
    return inc(paths.versionToBump.api, 'patch');
  });

  gulp.task('bump-views-patch', [], function() {
    return inc(paths.versionToBump.views, 'patch');
  });

  gulp.task('bump-ui-patch', [], function() {
    return inc(paths.versionToBump.ui, 'patch');
  });

  gulp.task('bump-admin-patch', [], function() {
    return inc(paths.versionToBump.admin, 'patch');
  });

  gulp.task('bump-data-patch', [], function() {
    return inc(paths.versionToBump.data, 'patch');
  });

  // MAIN TASKS

  gulp.task('bump-version', [
    'check-version-arg',
    'bump-project-version',
    'bump-api-version',
    'bump-views-version',
    'bump-ui-version',
    'bump-admin-version',
    'bump-data-version',
    'commit'
  ]);

  gulp.task('bump-major', [
    'bump-project-major',
    'bump-api-major',
    'bump-views-major',
    'bump-ui-major',
    'bump-admin-major',
    'bump-data-major',
    'commit'
  ]);

  gulp.task('bump-minor', [
    'bump-project-minor',
    'bump-api-minor',
    'bump-views-minor',
    'bump-ui-minor',
    'bump-admin-minor',
    'bump-data-minor',
    'commit'
  ]);

  gulp.task('bump-patch', [
    'bump-project-patch',
    'bump-api-patch',
    'bump-views-patch',
    'bump-ui-patch',
    'bump-admin-patch',
    'bump-data-patch',
    'commit'
  ]);

  gulp.task('tag', function() {
    return gulp.src(paths.versionToCheck)
        // **tag it in the repository**
        .pipe(tag_version());
  });

  gulp.task('default', function() {
    console.info('Usages');
    console.info('gulp bump-version --version <semver>');
    console.info('gulp bump-major');
    console.info('gulp bump-minor');
    console.info('gulp bump-patch');
    console.info('gulp tag');
  });
})();
