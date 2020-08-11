const http = require('http');

const hostname = '172.105.38.170';
const port = 8000;

const server = http.createServer((req, res) => {
	res.statusCode = 200;
  	res.setHeader('Content-Type', 'text/plain');
  	res.end('This is the Main App!\n');
});

server.listen(port, hostname, () => {
  	console.log(`Server running at http://${hostname}:${port}/`);
});
