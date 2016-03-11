(function(){

  var gulp = require('gulp');
  var bump = require('gulp-bump');
  var filter = require('gulp-filter');
  var git = require('gulp-git');
  var tag_version = require('gulp-tag-version');
  var argv = require('minimist')(process.argv.slice(2));

  var srcdst = {
    project: {
      src: ['./package.json'],
      dst: './'
    },
    api: {
      src: ['./api/package.json'],
      dst: './api'
    },
    ui: {
      src: ['./ui/package.json'],
      dst: './ui'
    },
    recovery: {
      src: ['./recovery/package.json'],
      dst: './recovery'
    },
    admin: {
      src: ['./admin/src/package.json'],
      dst: './admin/src'
    },
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

  var tag = function(reference) {
    // Construit un tableau comprenant toutes les src
    var src = Object.getOwnPropertyNames(srcdst).map(function(name) {
      return srcdst[name].src;
    }).reduce(function(mem, arr) {
    	Array.prototype.push.apply(mem, arr);
    	return mem;
    }, []);


    // read only one reference file to get the version number
    return gulp.src(src)
        // commit the changed version number
        .pipe(git.commit('bumps package version'))

        // read only one file to get the version number
        .pipe(filter(reference))
        // **tag it in the repository**
        .pipe(tag_version());
  };

  // Version subtasks

  gulp.task('check-version-arg', function(){
    if (!argv.version) {
      throw 'Numéro de version absent. Tapez `gulp` pour voir les usages∏';
    }
  });

  gulp.task('bump-project-version', function(){
    return ver(srcdst.project, argv.version);
  });

  gulp.task('bump-api-version', function(){
    return ver(srcdst.api, argv.version);
  });

  gulp.task('bump-ui-version', function(){
    return ver(srcdst.ui, argv.version);
  });

  gulp.task('bump-recovery-version', function(){
    return ver(srcdst.recovery, argv.version);
  });

  gulp.task('bump-admin-version', function(){
    return ver(srcdst.admin, argv.version);
  });

  // Major subtasks

  gulp.task('bump-project-major', [], function() {
    return inc(srcdst.project, 'major');
  });

  gulp.task('bump-api-major', [], function() {
    return inc(srcdst.api, 'major');
  });

  gulp.task('bump-ui-major', [], function() {
    return inc(srcdst.ui, 'major');
  });

  gulp.task('bump-recovery-major', [], function() {
    return inc(srcdst.recovery, 'major');
  });

  gulp.task('bump-admin-major', [], function() {
    return inc(srcdst.admin, 'major');
  });

  // Minor subtasks

  gulp.task('bump-project-minor', [], function() {
    return inc(srcdst.project, 'minor');
  });

  gulp.task('bump-api-minor', [], function() {
    return inc(srcdst.api, 'minor');
  });

  gulp.task('bump-ui-minor', [], function() {
    return inc(srcdst.ui, 'minor');
  });

  gulp.task('bump-recovery-minor', [], function() {
    return inc(srcdst.recovery, 'minor');
  });

  gulp.task('bump-admin-minor', [], function() {
    return inc(srcdst.admin, 'minor');
  });

  // Patch subtasks

  gulp.task('bump-project-patch', [], function() {
    return inc(srcdst.project, 'patch');
  });

  gulp.task('bump-api-patch', [], function() {
    return inc(srcdst.api, 'patch');
  });

  gulp.task('bump-ui-patch', [], function() {
    return inc(srcdst.ui, 'patch');
  });

  gulp.task('bump-recovery-patch', [], function() {
    return inc(srcdst.recovery, 'patch');
  });

  gulp.task('bump-admin-patch', [], function() {
    return inc(srcdst.admin, 'patch');
  });

  // MAIN TASKS

  gulp.task('bump-version', ['check-version-arg', 'bump-project-version', 'bump-api-version', 'bump-ui-version', 'bump-admin-version', 'bump-recovery-version'], function() {
    return tag(srcdst.project.src[0]);
  });

  gulp.task('bump-major', ['bump-project-major', 'bump-api-major', 'bump-ui-major', 'bump-recovery-major', 'bump-admin-major'], function() {
    return tag(srcdst.project.src[0]);
  });

  gulp.task('bump-minor', ['bump-project-minor', 'bump-api-minor', 'bump-ui-minor', 'bump-recovery-minor', 'bump-admin-minor'], function() {
    return tag(srcdst.project.src[0]);
  });

  gulp.task('bump-patch', ['bump-project-patch', 'bump-api-patch', 'bump-ui-patch', 'bump-recovery-patch', 'bump-admin-patch'], function() {
    return tag(srcdst.project.src[0]);
  });

  gulp.task('default', function() {
    console.info('Usages');
    console.info('gulp bump-version --version <semver>');
    console.info('gulp bump-major');
    console.info('gulp bump-minor');
    console.info('gulp bump-patch');
  });
})();
