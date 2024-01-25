var partyLinkElement = document.createElement("a");
partyLinkElement.innerHTML = "Party";
partyLinkElement.style.cursor = "pointer";

var linksWrap = document.getElementById('linksWrap');

function sendMessageToWorker(message, responseCallback = undefined) {
    chrome.runtime.sendMessage(message, function (response) {
        if (responseCallback !== undefined) {
            responseCallback(response);
        }
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type !== undefined) {
        switch (request.type) {
            case "loadLobbyScreen":
                loadLobbyScreen(request.asHost, request.code);
                sendResponse({ status: "success" });
                break;
            case "updateConnectedClients":
                if (request.connectedClients !== undefined) {
                    updateConnectedClients(request.connectedClients);
                    sendResponse({ status: "success" });
                }
                break;
            case "getName":
                sendResponse({ status: "success", name: getName() });
                break;
        }
    }
    return true;
});

linksWrap.appendChild(partyLinkElement);

partyLinkElement.addEventListener("click", function (event) {
    // Prevent the default behavior of the link
    event.preventDefault();
    // Execute your function
    loadPartyPage();
});

function loadPartyPage() {
    var hostPartyElement = document.createElement("a");
    hostPartyElement.innerHTML = "Host new Party";
    hostPartyElement.style.cursor = "pointer";
    hostPartyElement.addEventListener("click", () => {
        sendMessageToWorker({ type: "hostParty" });
    });
    var joinPartyElement = document.createElement("a");
    joinPartyElement.innerHTML = "Join existing Party";
    joinPartyElement.style.cursor = "pointer";
    joinPartyElement.addEventListener("click", () => {
        var party_code = prompt("Enter Party Code:");
        sendMessageToWorker({ type: "joinParty", code: party_code });
    })

    linksWrap.innerHTML = "";

    linksWrap.style.flexDirection = "column";

    linksWrap.appendChild(hostPartyElement);
    linksWrap.appendChild(joinPartyElement);
}

function loadLobbyScreen(asHost, party_code) {
    var center_container = document.getElementsByClassName('centre')[0];
    if (asHost) {
        center_container.innerHTML = `<h1>Code: ${party_code}</h1><div id="connected_clients_container"></div>`;
    } else {
        center_container.innerHTML = `<h1>Connected to ${party_code}!</h1><div id="connected_clients_container"></div>`;
    }
    updateConnectedClients([]);
}

function updateConnectedClients(connectedClients) {
    var connectedClientsContainer = document.getElementById('connected_clients_container');
    if(connectedClientsContainer !== null) {
        if (connectedClients.length == 0) {
            connectedClientsContainer.innerHTML = "<h2>Waiting for other players...</h2>";
        } else {
            connectedClientsContainer.innerHTML = "";
            connectedClients.forEach((client) => {
                connectedClientsContainer.innerHTML += `<h2>${client.name}</h2>`;
            });
        }
    }
}

function getName() {
    var login_name = document.getElementsByClassName("loginText");
    if (login_name.length == 0) {
        return "Anonymus";
    } else {
        login_name = login_name[0].innerHTML;
        if (login_name == "Create Account") {
            return "Anonymus";
        }
        return login_name;
    }
}