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
const sass = require('gulp-sass')(require('sass'))
const browserSync = require('browser-sync').create()
const sourcemaps = require('gulp-sourcemaps')
const uglify = require('gulp-uglify')
const fs = require('fs')
const path = require('path')
const pump = require('pump')

const buildHtmlFiles = require('./build-html')

const isProduction = ['production', 'prod'].includes(process.env.NODE_ENV)
const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  copies: ['images', 'files', 'robots.txt', ...(isProduction ? [] : ['fonts', 'vendor'])],
}

/**
 * BUILD HTML
 */
const cleanHtml = () => del(path.join(paths.dist, '**', '*.html'))
const buildHtml = () => {
  buildHtmlFiles(isProduction, paths)

  return pump([
    gulp.src(path.join(paths.dist, '**', '*.html')),
    cachebust({
      basePath: `${paths.dist}${path.sep}`,
    }),
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

/** Copy static asset trees with Node (avoids gulp glob/stream quirks for binary assets). */
const copyFiles = async () => {
  await Promise.all(
    paths.copies.map(async copy => {
      const from = path.join(paths.src, copy)
      const to = path.join(paths.dist, copy)
      if (!fs.existsSync(from)) return
      await fs.promises.cp(from, to, { recursive: true, force: true })
    })
  )
}

const cleanAndCopyFiles = gulp.series(cleanCopies, copyFiles)

const clean = () => del(paths.dist)
const build = gulp.series(clean, gulp.parallel(buildStyles, buildScripts, copyFiles), buildHtml)
const reload = done => {
  if (browserSync.active) {
    browserSync.reload()
  }
  done()
}

const registerWatchers = () => {
  gulp.watch(
    [path.join(paths.src, '**', '*.hbs'), path.join(paths.src, 'templates', 'pages.json')],
    gulp.series(cleanAndBuildHtml, reload)
  )
  gulp.watch(path.join(paths.src, '**', '*.scss'), gulp.series(cleanAndBuildStyles, reload))
  gulp.watch(path.join(paths.src, '**', '*.js'), gulp.series(cleanAndBuildScripts, reload))
  gulp.watch(paths.copies.map(copy => path.join(paths.src, copy, '**')), gulp.series(cleanAndCopyFiles, reload))
}

const watch = () => {
  registerWatchers()
}

const startServer = done => {
  browserSync.init(
    {
      server: {
        baseDir: paths.dist,
        index: 'index.html',
      },
      port: 8000,
      host: '0.0.0.0',
      open: false,
      notify: false,
      ui: false,
    },
    done
  )
}

/** One-shot static preview (no watch). Expects `dist` already built. */
const serve = done => startServer(done)

/** Full local dev: production-style build once, then BrowserSync + file watchers with reload. */
const dev = gulp.series(build, startServer, done => {
  registerWatchers()
  done()
})

exports.clean = clean
exports.serve = serve
exports.build = build
exports.watch = watch
exports.dev = dev
exports.default = build
