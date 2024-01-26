const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');


const app = express();
const port = 11444;

const HOST = 0;
const CLIENT = 1;

const options = {
    key: fs.readFileSync('private.key'),
    cert: fs.readFileSync('cert.crt')
};

const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

var parties = new Map();
var connections = new Map();
var client_id_ctr = 0;

app.use(express.json());

app.all('/api/hostParty', (req, res) => {
    var code = require('crypto').randomBytes(8).toString('hex').slice(0, 4);

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Origin': '*',
    });
    res.send({ success: true, data: { party_code: code } });
});

app.post('/api/joinParty', (req, res) => {
    var code = req.get('party_code');
});

wss.on('connection', (ws) => {

    ws.on('message', (message) => {
        res = JSON.parse(message.toString());
        switch (res.type) {
            case "connect":
                if (res.host == true) {
                    parties.set(res.code, 
                        {
                            host: {socket: ws},
                            clients: []
                        });
                    connections.set(ws, {type: HOST, code: res.code});
                    ws.send(JSON.stringify({ type: "message", data: "Successfully registered Party!" }));
                    console.log(`Host connected.`);
                } else {
                    var party = parties.get(res.code);
                    if (party !== undefined) {
                        var id = client_id_ctr++;
                        party.host.socket.send(JSON.stringify({ type: "client_connect", id: id, name: res.name }));
                        party.clients.push({
                            socket: ws,
                            name: res.name,
                            id: id
                        });
                        connections.set(ws, {type: CLIENT, code: res.code});
                        ws.send(JSON.stringify({ type: "connection_success", code: party.host.code, id: id, name: res.name }));
                        console.log(`Client connected.`);
                    } else {
                        ws.send(JSON.stringify({ type: "message", data: "No such Party!" }));
                        console.log(`Party not found.`);
                    }
                }
                break;
            case "startGame":
                startGame((link) => {
                    ws.send(JSON.stringify({ type: "game_link", link: link }));
                    var connection = connections.get(ws);
                    var party = parties.get(connection.code);
                    if(connection.type === HOST) {
                        if(party !== undefined) {
                            party.clients.forEach((client) => {
                                try {
                                    client.socket.send(JSON.stringify({ type: "game_link", link: link }));
                                } catch (error) {
                                    console.log(error);
                                }
                            });
                        } else {
                            console.log("Party not found");
                        }
                    } else {
                        console.log("client is not allowed to start a game.");
                    }
                });
                break;
        }
    });

    ws.on('close', () => {
        var connection = connections.get(ws);
        var party = parties.get(connection.code);
        if(party !== undefined) {
            if (connection.type === CLIENT) { // socket is client
                var client_index = party.clients.findIndex((client) => client.socket == ws); // id of deleted client
                if (client_index >= 0) {
                    var dead_client = party.clients[client_index]; // deleted client
    
                    try {
                        party.host.socket.send(JSON.stringify({ type: "client_disconnect", name: dead_client.name, id: dead_client.id }));
                    } catch (error) {
                        console.log("Not possible to send to closed connection.");
                    }
    
                    party.clients.splice(client_index, 1);
    
                    party.clients.forEach((client) => {
                        try {
                            client.socket.send(JSON.stringify({ type: "client_disconnect", name: dead_client.name, id: dead_client.id }));
                        } catch (error) {
                            console.log(error);
                        }
                    });
                }
                console.log(`Client disconnected.`);
            } else { // socket is host
                party.clients.forEach((client, client_index) => {
                    client.socket.close();
                });
                parties.delete(connection.code);
                console.log(`Host disconnected.`);
            }
        }
        connections.delete(ws);
    });
});

function startGame(callback = () => {}) {
    fetch("https://timeguessr.com/getPlay", {
        method: 'post',
        mode: 'cors',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    .then(response => response.json())
    .then(json => {
        const shareLink = 'https://timeguessr.com/roundone?RA=' + String(json[5]) + ':' + String(json[6]);
        callback(shareLink);
    }).catch((error) => {console.log(error)});
}

function startTimer(durationInSeconds = 30, callback = () => {}) {
    var timer = setTimeout(() => {
        callback();
    }, durationInSeconds * 1000);
}

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});