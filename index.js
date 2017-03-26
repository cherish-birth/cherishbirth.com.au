// Load environment from .env file
require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const morgan = require('morgan');
const hbs = require('express-hbs');
const md5File = require('md5-file');

// Add a Handlebars 'equal' helper
hbs.registerHelper('equal', function equal(value1, value2, options) {
  let op = value1 == value2 ? 'fn' : 'inverse';

  return options[op](this);
});

// Setup the express app
const app = express();
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, '/views/pages'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.express4({
  partialsDir: path.join(__dirname, '/views/partials'),
  layoutsDir: path.join(__dirname, '/views/layouts'),
  defaultLayout: path.join(__dirname, '/views/layouts/main.hbs'),
}));

// Add view variables
app.locals.env = app.get('env');
app.locals.cssFile = app.locals.env === 'production' ? '/css/style.min.css' : '/css/style.css';
app.locals.cssHash = md5File.sync(path.join(__dirname, '/public', app.locals.cssFile));
app.locals.jsFile = app.locals.env === 'production' ? '/js/script.min.js' : '/js/script.js';
app.locals.jsHash = md5File.sync(path.join(__dirname, '/public', app.locals.jsFile));

// Setup the express router
const router = express.Router();
app.use('/', router);

// Add the page routes
const baseTitle = 'Cherish Birth';
app.locals.pages = require('./pages.json');
app.locals.pages.forEach(page => {
  if (!page.url || !page.template) return;

  router.get(page.url, (req, res) => res.render(page.template, {
    browserTitle: (page.browserTitle ? `${page.browserTitle} | ` : '') + baseTitle,
    activeMenu: page.activeMenuId || null,
  }));
});

// Add a Sitemap.xml
router.get('/sitemap.xml', (req, res) => {
  res
    .header('Content-Type', 'application/xml; charset=utf-8')
    .render('sitemap', {
      baseUrl: 'https://cherishbirth.com.au',
      layout: null,
    });
});

// Add the error handler
app.use((req, res, next) => res.status(404).render('404', {
  title: `Not Found | ${baseTitle}`,
}));

// Create and start the http server
const server = http.createServer(app);
server.listen(app.get('port'), () => {
  console.log(`Serving on port ${app.get('port')}`);
});
