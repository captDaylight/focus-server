var gulp = require('gulp');
var requireDir = require('require-dir');
requireDir('./gulp');

gulp.task('default', ['copy', 'style', 'browserify', 'watch']);