const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');
const NOT_FOUND_FILE = path.join(DIST_DIR, '404.html');
const PORT = Number(process.env.PORT || 8000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (_) {
    return value;
  }
};

const isInsideDist = (candidatePath) => {
  const relativePath = path.relative(DIST_DIR, candidatePath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

const fileExists = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_) {
    return false;
  }
};

const resolveCandidates = (requestPath) => {
  const decodedPath = safeDecode(requestPath.split('?')[0].split('#')[0]);
  const sanitizedPath = decodedPath.replace(/^\/+/, '');
  const absolutePath = path.join(DIST_DIR, sanitizedPath);

  // No extension: try clean URL variants first.
  if (!path.extname(sanitizedPath)) {
    return [
      path.join(absolutePath, 'index.html'),
      `${absolutePath}.html`,
      absolutePath,
    ];
  }

  return [absolutePath];
};

const sendFile = (res, filePath, statusCode = 200) => {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const requestPath = req.url || '/';
  const candidates = resolveCandidates(requestPath);
  const match = candidates.find((candidate) => isInsideDist(candidate) && fileExists(candidate));

  if (match) {
    if (req.method === 'HEAD') {
      const extension = path.extname(match).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[extension] || 'application/octet-stream' });
      res.end();
      return;
    }
    sendFile(res, match);
    return;
  }

  if (fileExists(NOT_FOUND_FILE)) {
    if (req.method === 'HEAD') {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendFile(res, NOT_FOUND_FILE, 404);
    return;
  }

  // Last fallback if dist/404.html is missing.
  if (req.method === 'HEAD') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end();
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  const hasIndex = fileExists(INDEX_FILE);
  const status = hasIndex ? 'ready' : 'missing dist/index.html (run npm run build)';
  console.log(`Static server ${status} on port ${PORT}`);
});
