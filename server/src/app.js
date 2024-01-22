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

app.all('/api/hostParty', (req, res) => {
  var code = "test";
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Origin': '*',
  });
  res.send({success: true, data: {party_code: code}});
});

app.post('/api/joinParty', (req, res) => {
  var code = req.get('party_code');
})

https.createServer(options, app).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
