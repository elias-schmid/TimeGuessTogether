chrome.runtime.onInstalled.addListener(() => {
    // Set the action badge to the next state
    console.log("hello");
}
);

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
        }
    }
    return true;
});


var connectedClients = [];

function sendMessageToTab(message, tabId, responseCallback = undefined) {
    chrome.tabs.sendMessage(tabId, message, function (response) {
        if (responseCallback !== undefined) {
            responseCallback(response);
        }
    });
}

function hostParty(tab) {
    var server_url = "https://" + getPartyServer();

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
        });
}

function socketConnectHost(tab, code) {
    const socket = new WebSocket("wss://" + getPartyServer());

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
        var center_container = document.getElementsByClassName('centre')[0];
        center_container.innerHTML = `<h1>Disconnected from Server.</h1>`;
    });
}

function socketConnectClient(tab, code) {
    const socket = new WebSocket("wss://" + getPartyServer());

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
        var center_container = document.getElementsByClassName('centre')[0];
        center_container.innerHTML = `<h1>Disconnected from Host.</h1>`;
    });
}

function getPartyServer() {
    // var cookie_name = "party_server";
    // var re = new RegExp(`^(?:.*;)?\\s*${cookie_name}\\s*=\\s*([^;]+)(?:.*)?$`);
    // var value = (document.cookie.match(re) || [, null])[1];
    // if (value === null) {
    //     value = `${cookie_name}=${prompt("Enter Party Server (Format: <domain>:<port>)")}`;
    //     document.cookie = value;
    // }
    // return value;
    return "elias-schmid.de:11444"
}