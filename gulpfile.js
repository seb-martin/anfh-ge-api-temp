var gulp = require('gulp');
var bump = require('gulp-bump');
var argv = require('minimist')(process.argv.slice(2));

gulp.task('check-vesrion-arg', function(){
  if (!argv.version) {
    throw 'Numéro de version absent. Tapez `gulp` pour voir l\'usage';
  }
});

gulp.task('bump-api', function(){
  gulp.src('./api/package.json')
  .pipe(bump({version: argv.version}))
  .pipe(gulp.dest('./api'));
});

gulp.task('bump-ui', function(){
  gulp.src('./ui/package.json')
  .pipe(bump({version: argv.version}))
  .pipe(gulp.dest('./ui'));
});

gulp.task('bump-recovery', function(){
  gulp.src('./recovery/package.json')
  .pipe(bump({version: argv.version}))
  .pipe(gulp.dest('./recovery'));
});

gulp.task('bump-project', function(){
  gulp.src('./package.json')
  .pipe(bump({version: argv.version}))
  .pipe(gulp.dest('./'));
});

// Run the gulp tasks
gulp.task('bump', ['check-vesrion-arg', 'bump-project', 'bump-api', 'bump-ui', 'bump-recovery']);

gulp.task('default', function() {
  console.log('Usage: gulp bump --version=1.0.0');
});
