const http = require('http');
const fs = require('fs');
const path = require('path');
const port = Number(process.env.PORT || 4317);
const token = process.env.INTERNAL_CMS_FACTS_TOKEN || 'local-smoke-token';
const factsPath = path.join(process.cwd(), 'docs', 'cms-facts.example.json');
const facts = fs.readFileSync(factsPath, 'utf8');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/internal/cms/facts') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not-found' }));
    return;
  }
  const auth = req.headers.authorization || '';
  if (token && auth !== `Bearer ${token}`) {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(facts);
});
server.listen(port, '127.0.0.1', () => console.log(`facts-api-ready:${port}`));
