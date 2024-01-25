var partyLinkElement = document.createElement("a");
partyLinkElement.innerHTML = "Party";
partyLinkElement.style.cursor = "pointer";

var linksWrap = document.getElementById('linksWrap');

var connectedClients = [];

linksWrap.appendChild(partyLinkElement);

partyLinkElement.addEventListener("click", function (event) {
    // Prevent the default behavior of the link
    event.preventDefault();
    // Execute your function
    loadPartyPage();
});

function loadPartyPage() {
    var hostPartyElement = document.createElement("a");
    hostPartyElement.innerHTML ="Host new Party";
    hostPartyElement.style.cursor = "pointer";
    hostPartyElement.addEventListener("click", () => {hostParty();})
    var joinPartyElement = document.createElement("a");
    joinPartyElement.innerHTML = "Join existing Party";
    joinPartyElement.style.cursor = "pointer";
    joinPartyElement.addEventListener("click", () => {joinParty();})

    linksWrap.innerHTML = "";
    
    linksWrap.style.flexDirection = "column";

    linksWrap.appendChild(hostPartyElement);
    linksWrap.appendChild(joinPartyElement);
}

function hostParty() {
    var server_url = "https://" + getPartyServer();

    fetch(server_url+"/api/hostParty", {
        method: 'get',
        mode: 'cors',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    .then(response => response.json())
    .then(json => {
        var party_code = json.data.party_code;
        var center_container = document.getElementsByClassName('centre')[0];
        center_container.innerHTML = `<h1>Code: ${party_code}</h1><div id="connected_clients_container"></div>`;
        updateConnectedClients();
        socketConnectHost(party_code);
    });

}

function socketConnectHost(code) {
    const socket = new WebSocket("wss://" + getPartyServer());

    socket.addEventListener("open", (event) => {
        socket.send(JSON.stringify({host: true, code: code}));
    });

    socket.addEventListener('message', (event) => {
        msg = JSON.parse(event.data);
        switch (msg.type) {
            case "connection_success":
                var center_container = document.getElementsByClassName('centre')[0];
                center_container.innerHTML = `<h1>Connected to ${msg.code}!</h1>`;
                break;
            case "client_connect":
                connectedClients.push({id: msg.id, name: msg.name});
                updateConnectedClients();
                break;
            case "client_disconnect":
                var index = connectedClients.findIndex((element) => element.id = msg.id);
                connectedClients.splice(index, 1);
                updateConnectedClients();
                break;

        }
    });

    socket.addEventListener('close', (event) => {
        var center_container = document.getElementsByClassName('centre')[0];
        center_container.innerHTML = `<h1>Disconnected from Server.</h1>`;
    });
}


function joinParty() {
    var party_code = prompt("Enter Party Code:");
    socketConnectClient(party_code);
}

function socketConnectClient(code) {
    const socket = new WebSocket("wss://" + getPartyServer());

    socket.addEventListener("open", (event) => {
        socket.send(JSON.stringify({host: false, code: code, name: getName()}));
    });

    socket.addEventListener('message', (event) => {
        msg = JSON.parse(event.data);
        switch (msg.type) {
            case "connection_success":
                var center_container = document.getElementsByClassName('centre')[0];
                center_container.innerHTML = `<h1>Joined ${msg.code}</h1><div id="connected_clients_container"></div>`;
                break;   
            case "client_disconnect":
                var index = connectedClients.findIndex((element) => element.id = msg.id);
                connectedClients.splice(index, 1);
                updateConnectedClients();
                break;
        }
    });

    socket.addEventListener('close', (event) => {
        var center_container = document.getElementsByClassName('centre')[0];
        center_container.innerHTML = `<h1>Disconnected from Host.</h1>`;
    });
}

function updateConnectedClients() {
    var connectedClientsContainer = document.getElementById('connected_clients_container');
    if(connectedClients.length == 0) {
        connectedClientsContainer.innerHTML = "<h2>Waiting for other players...</h2>";
    } else {
        connectedClientsContainer.innerHTML = "";
        connectedClients.forEach((client) => {
            connectedClientsContainer.innerHTML += `<h2>${client.name}</h2>`;
        });
    }
}

function getPartyServer() {
    var cookie_name = "party_server";
    var re = new RegExp(`^(?:.*;)?\\s*${cookie_name}\\s*=\\s*([^;]+)(?:.*)?$`);
    var value = (document.cookie.match(re)||[,null])[1];
    if(value === null) {
        value = `${cookie_name}=${prompt("Enter Party Server (Format: <domain>:<port>)")}`;
        document.cookie = value;
    }
    return value;
}

function getName() {
    var login_name = document.getElementsByClassName("loginText");
    if(login_name.length == 0) {
        return "Anonymus";
    } else {
        login_name = login_name[0].innerHTML;
        if(login_name == "Create Account") {
            return "Anonymus";
        }
        return login_name;
    }
}