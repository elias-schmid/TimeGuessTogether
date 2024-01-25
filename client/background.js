chrome.runtime.onInstalled.addListener(() => {
    // Set the action badge to the next state
    console.log("hello");
}
);

var connectedClients = [];

var activeConnections = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type !== undefined) {
        switch (request.type) {
            case "hostParty":
                hostParty(sender.tab);
                sendResponse({ status: "success" });
                break;
            case "joinParty":
                if (request.code !== undefined) {
                    socketConnectClient(sender.tab, request.code);
                    sendResponse({ status: "success" });
                } else {
                    sendResponse({ status: "error", message: "no code provided" });
                }
                break;
            case "closeConnection":
                closeConnection(sender.tab);
                sendResponse({ status: "success" });
                break;
            case "setServerUrl":
                if (request.url !== undefined) {
                    setPartyServer(request.url);
                    sendResponse({ status: "success" });
                } else {
                    sendResponse({ status: "error", message: "no url provided" });
                }
                break;
            case "getServerUrl":
                getPartyServer((response) => sendResponse({ status: "success", url: response.server_url }));
                break;
                
        }
    }
    return true;
});

function sendMessageToTab(message, tabId, responseCallback = undefined) {
    chrome.tabs.sendMessage(tabId, message, function (response) {
        if (responseCallback !== undefined) {
            responseCallback(response);
        }
    });
}

function hostParty(tab) {
    getPartyServer((res) => {
        var server_url = "https://" + res.server_url;
        fetch(server_url + "/api/hostParty", {
            method: 'get',
            mode: 'cors',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
        .then(response => response.json())
        .then(json => {
            var party_code = json.data.party_code;
            sendMessageToTab({ type: "loadLobbyScreen", asHost: true, code: party_code }, tab.id, (res) => {
                if (res.status == "success") {
                    socketConnectHost(tab, party_code);
                }
            });
        }).catch((error) => { sendMessageToTab({ type: "displayInfoMessage", message: "url not reachable" }, tab.id); });
    });

}

function socketConnectHost(tab, code) {
    getPartyServer((partyserver) => {
        const socket = new WebSocket("wss://" + partyserver.server_url);

        activeConnections.push({tabId: tab.id, socket: socket});

        socket.addEventListener("open", (event) => {
            socket.send(JSON.stringify({ host: true, code: code }));
        });

        socket.addEventListener('message', (event) => {
            msg = JSON.parse(event.data);
            switch (msg.type) {
                case "client_connect":
                    connectedClients.push({ id: msg.id, name: msg.name });
                    sendMessageToTab({ type: "updateConnectedClients", connectedClients: connectedClients }, tab.id);
                    break;
                case "client_disconnect":
                    var index = connectedClients.findIndex((element) => element.id = msg.id);
                    connectedClients.splice(index, 1);
                    sendMessageToTab({ type: "updateConnectedClients", connectedClients: connectedClients }, tab.id);
                    break;
            }
        });

        socket.addEventListener('close', (event) => {
            sendMessageToTab({ type: "disconnectMessage", isHost: true }, tab.id);
            activeConnections.splice(activeConnections.findIndex((t) => t.tabId == tab.id), 1);
        });
    });
}

function socketConnectClient(tab, code) {
    getPartyServer((partyserver) => {
        const socket = new WebSocket("wss://" + partyserver.server_url);

        activeConnections.push({tabId: tab.id, socket: socket});
    
        socket.addEventListener("open", (event) => {
            sendMessageToTab({ type: "getName" }, tab.id, (res) => {
                if (res.status == "success" && res.name !== undefined) {
                    socket.send(JSON.stringify({ host: false, code: code, name: res.name }));
                } else {
                    socket.send(JSON.stringify({ host: false, code: code, name: "undefined" }));
                }
            });
        });
    
        socket.addEventListener('message', (event) => {
            msg = JSON.parse(event.data);
            switch (msg.type) {
                case "connection_success":
                    sendMessageToTab({ type: "loadLobbyScreen", asHost: false, code: code }, tab.id);
                    break;
                case "client_disconnect":
                    var index = connectedClients.findIndex((element) => element.id = msg.id);
                    connectedClients.splice(index, 1);
                    sendMessageToTab({ type: "updateConnectedClients", connectedClients: connectedClients }, tab.id);
                    break;
            }
        });
    
        socket.addEventListener('close', (event) => {
            sendMessageToTab({ type: "disconnectMessage", isHost: false }, tab.id);
            activeConnections.splice(activeConnections.findIndex((t) => t.tabId == tab.id), 1);
        });
    });

}

function closeConnection(tab) {
    var connection = activeConnections.find((conn) => conn.tabId == tab.id);
    if(connection !== undefined) {
        connection.socket.close()
    } else {
        console.log("Connection not found.")
    }
}

function getPartyServer(callback = () => {}) {
    chrome.storage.local.get(["server_url"]).then((result) => {callback(result)});
}

async function setPartyServer(serverUrl) {
    try {
        await chrome.storage.local.set({server_url: serverUrl});
    } catch(error) {
        console.log(error);
    }
}