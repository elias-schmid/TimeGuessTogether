const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');


const app = express();
const port = 11444;

const options = {
    key: fs.readFileSync('private.key'),
    cert: fs.readFileSync('cert.crt')
};

const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

var hosts = [];
var clients = [];
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
                    hosts.push({
                        code: res.code,
                        socket: ws
                    });
                    ws.send(JSON.stringify({ type: "message", data: "Successfully registered Party!" }));
                    console.log(`Host connected. Currently are ${hosts.length} hosts connected.`);
                } else {
                    var host = hosts.find((curr) => curr.code == res.code);
                    if (host !== undefined) {
                        var id = client_id_ctr++;
                        host.socket.send(JSON.stringify({ type: "client_connect", id: id, name: res.name }))
                        clients.push({
                            code: res.code,
                            socket: ws,
                            name: res.name,
                            id: id
                        });
                        ws.send(JSON.stringify({ type: "connection_success", code: host.code, id: id, name: res.name }));
                        console.log(`Client connected.`);
                    } else {
                        ws.send(JSON.stringify({ type: "message", data: "No such Party!" }));
                        console.log(`Host not found.`);
                    }
                }
                break;
            case "startGame":
                startGame((link) => {
                    ws.send(JSON.stringify({ type: "game_link", link: link }));
                    var hostConnection = hosts.find((host) => host.socket == ws);
                    clients.forEach((client) => {
                        if (client.code == hostConnection.code) {
                            try {
                                client.socket.send(JSON.stringify({ type: "game_link", link: link }));
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    });
                });
                break;
        }
    });

    ws.on('close', () => {
        var host_index = hosts.findIndex((element) => element.socket == ws);
        if (host_index == -1) { // is client
            var client_index = clients.findIndex((client) => client.socket == ws); // id of deleted client
            if (client_index >= 0) {
                var dead_client = clients[client_index]; // deleted client
                var parent_index = hosts.findIndex((host) => host.code == dead_client.code); // id of parent of deleted client

                try {
                    hosts[parent_index].socket.send(JSON.stringify({ type: "client_disconnect", name: dead_client.name, id: dead_client.id }));
                } catch (error) {
                    console.log("Not possible to send to closed connection.");
                }

                clients.splice(client_index, 1);

                clients.forEach((client) => {
                    if (client.code == dead_client.code) {
                        try {
                            client.socket.send(JSON.stringify({ type: "client_disconnect", name: dead_client.name, id: dead_client.id }));
                        } catch (error) {
                            console.log(error);
                        }
                    }
                });
            }
            console.log(`Client disconnected.`);
        } else {
            clients.forEach((client, client_index) => {
                if (client.code == hosts[host_index].code) {
                    client.socket.close();
                    clients.slice(client_index, 1);
                }
            });
            hosts.splice(host_index, 1);
            console.log(`Host disconnected. ${hosts.length} hosts remaining.`);
        }
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

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});