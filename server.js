// server.js - Simple local web server for the Vim motions learning game
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Strip the query string (e.g. cache-busting ?v=...) before resolving a file path,
  // then decode URL to handle spaces or special characters
  const urlPath = req.url.split('?')[0];
  const decodedUrl = decodeURIComponent(urlPath);
  let filePath = path.join(__dirname, decodedUrl === '/' ? 'index.html' : decodedUrl);

  // Safety check: ensure file path stays within current directory to prevent directory traversal
  const relative = path.relative(__dirname, filePath);
  const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  
  if (decodedUrl !== '/' && !isSafe) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>', 'utf-8');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`<h1>500 Internal Server Error</h1><p>Error code: ${error.code}</p>`, 'utf-8');
      }
    } else {
      // Local dev server: never cache, so a normal refresh always reflects the current files
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`   TERMINAL IDE CHEATSHEET DEV SERVER RUNNING`);
  console.log(`   URL: http://localhost:${PORT}/`);
  console.log(`==================================================\n`);
});
