const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const path = require('path');

const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  copies: ['fonts', 'images', 'vendor'],
};


/**
 * BUILD
 */
gulp.task('default', ['build']);
gulp.task('build', ['build:styles', 'build:scripts', 'build:copies']);
gulp.task('clean', function () {
  return del(paths.dist);
});


/**
 * STYLES
 */
gulp.task('build:styles', ['clean:styles'], function () {
  return gulp.src(path.join(paths.src, 'styles', 'styles.scss'))
    .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(postcss([
        autoprefixer(),
        cssnano(),
      ]))
      .pipe(rename('styles.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('clean:styles', function () {
  return del([
    path.join(paths.dist, '**/*.css'),
    path.join(paths.dist, '**/*.css.map'),
  ]);
});


/**
 * SCRIPTS
 */
gulp.task('build:scripts', ['clean:scripts'], function () {
  return gulp.src(path.join(paths.src, 'scripts', '**', '*.js'))
    .pipe(sourcemaps.init())
      .pipe(concat('scripts.js'))
      .pipe(uglify())
      .on('error', (err) => console.error(err))
      .pipe(rename('scripts.min.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('clean:scripts', function () {
  return del([
    path.join(paths.dist, '**/*.js'),
    path.join(paths.dist, '**/*.js.map'),
  ]);
});


/**
 * COPIES
 */
gulp.task('build:copies', ['clean:copies'], function () {
  paths.copies.forEach(copy =>
    gulp.src(path.join(paths.src, copy, '**'))
      .pipe(gulp.dest(path.join(paths.dist, copy))));
});

gulp.task('clean:copies', function () {
  return del(paths.copies.map(copy => path.join(paths.dist, copy)));
});


/**
 * WATCH
 */
gulp.task('watch', ['build'], function () {
  gulp.watch(path.join(paths.src, '**', '*.scss'), ['build:styles']);
  gulp.watch(path.join(paths.src, '**', '*.js'), ['build:scripts']);
});
