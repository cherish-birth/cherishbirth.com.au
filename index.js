var path = require('path');
var http = require('http');
var express = require('express');
var morgan = require('morgan');
var hbs = require('express-hbs');

// Load environment from .env file
require('dotenv').config();

// Add a Handlebars 'equal' helper
hbs.registerHelper('equal', function equal(value1, value2, options) {
  let op = value1 == value2 ? 'fn' : 'inverse';

  return options[op](this);
});

// Setup the express app
var app = express();
app.locals.env = app.get('env');
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

// Setup the express router
var router = express.Router();
app.use('/', router);

// Add the page routes
var baseTitle = 'Cherish Birth';
app.locals.pages = require('./pages.json');
app.locals.pages.forEach(page => {
  if (!page.url || !page.template) return;

  router.get(page.url, (req, res) => res.render(page.template, {
    browserTitle: (page.browserTitle ? `${page.browserTitle} | ` : '') + baseTitle,
    activeMenu: page.activeMenuId
  }));
});

// Add a Sitemap.xml
router.get('/sitemap.xml', (req, res) => {
  res
    .header('Content-Type', 'application/xml; charset=utf-8')
    .render('sitemap', {
      baseUrl: 'https://cherishbirth.com.au',
      layout: null
    });
});

// Add the error handler
app.use((req, res, next) => res.status(404).render('404', {
  title: `Not Found | ${baseTitle}`,
}));

// Create and start the http server
var server = http.createServer(app);
server.listen(app.get('port'), () => {
  console.log(`Serving on port ${app.get('port')}`);
});
