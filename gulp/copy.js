var gulp = require('gulp');

gulp.task('copy', function(){
  // copy images to dist and build
  gulp.src('src/img/**')
    .pipe(gulp.dest('public/img'))

  // copy fonts to dist and build
  gulp.src('src/fonts/**')
    .pipe(gulp.dest('public/fonts'))
});