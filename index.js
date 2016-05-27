var path = require('path');
var http = require('http');
var express = require('express');
var morgan = require('morgan');
var hbs = require('express-hbs');

// Add a Handlebars 'equal' helper
hbs.registerHelper('equal', function equal(value1, value2, options) {
  let op = value1 == value2 ? 'fn' : 'inverse';

  return options[op](this);
});

// Setup the express app
var app = express();
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

// Add the express routes
var baseTitle = 'Cherish Birth';
var router = express.Router();
app.use('/', router);

router.get('/', (req, res) => res.render('index', {
  title: baseTitle,
  active: 'home',
}));
router.get('/about-me', (req, res) => res.render('about', {
  title: `About Me | ${baseTitle}`,
  active: 'about',
}));
router.get('/why-a-doula', (req, res) => res.render('doula', {
  title: `Why a Doula? | ${baseTitle}`,
  active: 'doula',
}));

// Error handler
app.use((req, res, next) => res.status(404).render('404', {
  title: `Not Found | ${baseTitle}`,
}));

// Create and start a http server
var server = http.createServer(app);
server.listen(app.get('port'), () => {
  console.log(`Serving on port ${app.get('port')}`);
});
