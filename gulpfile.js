const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const del = require('del')
const gulp = require('gulp')
const babel = require('gulp-babel')
const cachebust = require('gulp-cache-bust')
const concat = require('gulp-concat')
const htmlmin = require('gulp-htmlmin')
const postcss = require('gulp-postcss')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const server = require('gulp-server-livereload')
const sourcemaps = require('gulp-sourcemaps')
const uglify = require('gulp-uglify')
const path = require('path')
const pump = require('pump')

const buildHtmlFiles = require('./build-html')

const isProduction = ['production', 'prod'].includes(process.env.NODE_ENV)
const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  copies: ['images', 'files', ...(isProduction ? [] : ['fonts', 'vendor'])],
}

/**
 * BUILD HTML
 */
const cleanHtml = () => del(path.join(paths.dist, '**', '*.html'))
const buildHtml = () => {
  buildHtmlFiles(isProduction, paths)

  return pump([
    gulp.src(path.join(paths.dist, '**', '*.html')),
    cachebust(),
    htmlmin({ collapseWhitespace: true, removeComments: true }),
    gulp.dest(paths.dist),
  ])
}
const cleanAndBuildHtml = gulp.series(cleanHtml, buildHtml)

/**
 * BUILD STYLES
 */
const cleanStyles = () =>
  del([path.join(paths.dist, '**', '*.min.css'), path.join(paths.dist, '**', '*.min.css.map')])
const buildStyles = () =>
  pump([
    gulp.src(path.join(paths.src, 'styles', 'styles.scss')),
    sourcemaps.init(),
    sass(),
    postcss([autoprefixer(), cssnano()]),
    rename('styles.min.css'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ])
const cleanAndBuildStyles = gulp.series(cleanStyles, buildStyles)

/**
 * BUILD SCRIPTS
 */
const cleanScripts = () =>
  del([path.join(paths.dist, '**', '*.min.js'), path.join(paths.dist, '**', '*.min.js.map')])
const buildScripts = () =>
  pump([
    gulp.src(path.join(paths.src, 'scripts', '**', '*.js')),
    sourcemaps.init(),
    babel({ presets: ['@babel/preset-env'] }),
    concat('scripts.js'),
    uglify(),
    rename('scripts.min.js'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ])
const cleanAndBuildScripts = gulp.series(cleanScripts, buildScripts)

/**
 * COPY FILES
 */
const cleanCopies = () => del(paths.copies.map(copy => path.join(paths.dist, copy)))
const copyFiles = () =>
  Promise.all(
    paths.copies.map(copy =>
      pump([gulp.src(path.join(paths.src, copy, '**')), gulp.dest(path.join(paths.dist, copy))])
    )
  )
const cleanAndCopyFiles = gulp.series(cleanCopies, copyFiles)

const clean = () => del(paths.dist)
const build = gulp.series(clean, gulp.parallel(buildStyles, buildScripts, copyFiles), buildHtml)
const watch = () => {
  gulp.watch(
    [path.join(paths.src, '**', '*.hbs'), path.join(paths.src, 'templates', 'pages.json')],
    cleanAndBuildHtml
  )
  gulp.watch(path.join(paths.src, '**', '*.scss'), cleanAndBuildStyles)
  gulp.watch(path.join(paths.src, '**', '*.js'), cleanAndBuildScripts)
  gulp.watch(paths.copies.map(copy => path.join(paths.src, copy, '**')), cleanAndCopyFiles)
}
const serve = () =>
  gulp.src(paths.dist).pipe(
    server({
      host: '0.0.0.0',
      post: '8000',
      livereload: true,
      fallback: '404.html',
    })
  )

exports.clean = clean
exports.serve = serve
exports.build = build
exports.watch = watch
exports.default = build
