var gulp = require('gulp');
var uglify = require('gulp-uglify');
var removeLogs = require("gulp-remove-logging");
var rename = require('gulp-rename');

gulp.task('minify', function () {
  return gulp.src('dist/apexcharts.js')
    .pipe(removeLogs({
      methods: ['log'],
      verbose: true
    }))
    .pipe(uglify())
    .pipe(rename('apexcharts.min.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('build', ['minify']);
gulp.task('default', ['minify']);