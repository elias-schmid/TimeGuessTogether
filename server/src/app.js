const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 443;

const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('cert.crt')
};

app.use(express.json());

app.get('/api/hostParty', (req, res) => {
  var code = "test";
  res.send({success: true, data: {party_code: code}});
});

https.createServer(options, app).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
