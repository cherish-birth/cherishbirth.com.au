const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const gulp = require('gulp');
const cachebust = require('gulp-cache-bust');
const concat = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const server = require('gulp-server-livereload');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const path = require('path');
const pump = require('pump');

const buildHtml = require('./build-html');

const isProduction = ['production', 'prod'].includes(process.env.NODE_ENV);
const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  copies: ['images', ...(isProduction ? [] : ['fonts', 'vendor'])],
};


/**
 * BUILD
 */
gulp.task('default', ['build']);
gulp.task('build', ['build:styles', 'build:scripts', 'build:copies'], function () {
  return gulp.run('build:html');
});
gulp.task('server', function () {
  return gulp.src(paths.dist)
    .pipe(server({
      host: '0.0.0.0',
      post: '8000',
      livereload: true,
    }));
});
gulp.task('clean', function () {
  return del(paths.dist);
});


/**
 * HTML
 */
gulp.task('build:html', ['clean:html'], function() {
  buildHtml(isProduction, paths);

  return pump([
    gulp.src(path.join(paths.dist, '**', '*.html')),
    cachebust(),
    htmlmin({ collapseWhitespace: true, removeComments: true }),
    gulp.dest(paths.dist),
  ]);
});

gulp.task('clean:html', function () {
  return del(path.join(paths.dist, '**', '*.html'));
});


/**
 * STYLES
 */
gulp.task('build:styles', ['clean:styles'], function () {
  return pump([
    gulp.src(path.join(paths.src, 'styles', 'styles.scss')),
    sourcemaps.init(),
      sass(),
      postcss([ autoprefixer(), cssnano() ]),
      rename('styles.min.css'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ]);
});

gulp.task('clean:styles', function () {
  return del([
    path.join(paths.dist, '**', '*.min.css'),
    path.join(paths.dist, '**', '*.min.css.map'),
  ]);
});


/**
 * SCRIPTS
 */
gulp.task('build:scripts', ['clean:scripts'], function () {
  return pump([
    gulp.src(path.join(paths.src, 'scripts', '**', '*.js')),
    sourcemaps.init(),
      concat('scripts.js'),
      uglify(),
      rename('scripts.min.js'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ]);
});

gulp.task('clean:scripts', function () {
  return del([
    path.join(paths.dist, '**', '*.min.js'),
    path.join(paths.dist, '**', '*.min.js.map'),
  ]);
});


/**
 * COPIES
 */
gulp.task('build:copies', ['clean:copies'], function () {
  paths.copies.forEach(copy => pump([
    gulp.src(path.join(paths.src, copy, '**')),
    gulp.dest(path.join(paths.dist, copy)),
  ]));
});

gulp.task('clean:copies', function () {
  return del(paths.copies.map(copy => path.join(paths.dist, copy)));
});


/**
 * WATCH
 */
gulp.task('watch', ['build'], function () {
  gulp.watch([
    path.join(paths.src, '**', '*.hbs'),
    path.join(paths.src, 'templates', 'pages.json'),
  ], ['build:html']);
  gulp.watch(path.join(paths.src, '**', '*.scss'), ['build:styles']);
  gulp.watch(path.join(paths.src, '**', '*.js'), ['build:scripts']);
});
