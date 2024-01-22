const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 11444;

const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('cert.crt')
};

app.use(express.json());

app.get('/api/hostParty', (req, res) => {
  var code = "test";
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Origin': '*',
  });
  res.send({success: true, data: {party_code: code}});
});

https.createServer(options, app).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
