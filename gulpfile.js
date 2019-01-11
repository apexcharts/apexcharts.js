var gulp = require('gulp');
var uglify = require('gulp-uglify');
var removeLogs = require("gulp-remove-logging");
var rename = require('gulp-rename');

var sourceLocalesToCopy = 'src/locales/**/*';
var destLocalesToCopy = 'dist/locales';

gulp.task('locales', function () {
  return gulp
      .src(sourceLocalesToCopy)
      .pipe(gulp.dest(destLocalesToCopy));
});

gulp.task('css', function () {
  return gulp
      .src('src/assets/apexcharts.css')
      .pipe(gulp.dest('dist/apexcharts.css'));
});

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


gulp.task('build', ['locales', 'minify', 'css']);
gulp.task('default', ['minify']);