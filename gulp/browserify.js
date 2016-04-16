var gulp       = require('gulp');
var reactify   = require('reactify');
var source     = require('vinyl-source-stream');
var babel      = require('babelify');
var uglify     = require('gulp-uglify');
var buffer     = require('vinyl-buffer');
var browserify = require('browserify');
var livereload = require('gulp-livereload');


gulp.task('browserify', function () {
  browserify('src/js/index.js')
    .transform(babel)
    .transform(reactify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(gulp.dest('public/js'))
    .pipe(livereload())
});