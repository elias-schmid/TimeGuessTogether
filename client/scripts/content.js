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
            case "disconnectMessage":
                var isHost = false;
                if (request.isHost !== undefined) {
                    isHost = request.isHost;
                }
                disconnectMessage(isHost);
                sendResponse({ status: "success", name: getName() });
                break;
            case "displayInfoMessage":
                if (request.message !== undefined) {
                    sanitizeRegex = /^(\s|\w|\d|<br>)*?$/ 
                    if(sanitizeRegex.test(request.message)) {
                        displayInfoMessage(request.message);
                    } else {
                        displayInfoMessage("not a valid response from server");
                    }
                }
            case "openGame":
                if(request.link !== undefined) {
                    window.location = request.link;
                }
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
    var serverUrlInput = document.createElement("input");
    serverUrlInput.type = "text";
    serverUrlInput.addEventListener('change', () => {
        console.log("test");
        sendMessageToWorker({ type: "setServerUrl", url: serverUrlInput.value }, (res) => {
            if(res.status == "success") {
                displayInfoMessage("saved.", 200);
            } else {
                displayInfoMessage("Error");
            }
        });
    });

    serverUrlInput.style.width = "400px";
    serverUrlInput.style.padding = "5px";
    serverUrlInput.style.margin = "5px 0";
    serverUrlInput.style.fontSize = "17pt";
    serverUrlInput.style.border = "3px solid black";
    
    sendMessageToWorker({ type: "getServerUrl" }, (res) => {
        if(res.url !== undefined) {
            serverUrlInput.value = res.url;
        }
    });

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

    linksWrap.appendChild(serverUrlInput);
    linksWrap.appendChild(hostPartyElement);
    linksWrap.appendChild(joinPartyElement);
}

function loadLobbyScreen(asHost, party_code) {
    var center_container = document.getElementsByClassName('centre')[0];
    if (asHost) {
        center_container.innerHTML = `<h1>Code: ${party_code}</h1><div id="connected_clients_container"></div>`;
        var startButton = document.createElement("a");
        startButton.innerHTML = "Start the game";
        startButton.style.cursor = "pointer";
        startButton.addEventListener("click", () => {
            sendMessageToWorker({ type: "startGame", code: party_code }, (response) => {
                // window.location = response.link;
            });
        });
        center_container.appendChild(document.createElement("br"));
        center_container.appendChild(startButton);
        center_container.appendChild(document.createElement("br"));
    } else {
        center_container.innerHTML = `<h1>Connected to ${party_code}!</h1><div id="connected_clients_container"></div>`;
    }
    disconnectButton = document.createElement("a");
    disconnectButton.innerHTML = "Disconnect";
    disconnectButton.addEventListener('click', () => {
        sendMessageToWorker({ type: "closeConnection" });
    });
    center_container.appendChild(disconnectButton);
    updateConnectedClients([]);
}

function disconnectMessage(isHost) {
    var center_container = document.getElementsByClassName('centre')[0];
    if(isHost) {
        center_container.innerHTML = `<h1>Disconnected from Server.</h1>`;
    } else {
        center_container.innerHTML = `<h1>Disconnected from Host.</h1>`;
    }
    var homebutton = document.createElement("a");
    homebutton.innerHTML = "Go back";
    homebutton.style.cursor = "pointer";
    homebutton.addEventListener("click", () => {
        document.location = "/";
    });
    center_container.append(homebutton);
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

function displayInfoMessage(text, duration = 1500) {
    box = document.createElement("div");

    box.classList.add("infobox");

    box.style.position = "fixed";
    box.style.width = "600px";
    box.style.top = "10px";
    box.style.left = "50%";
    box.style.fontSize = "17pt";
    box.style.padding = "20px";
    box.style.transform = "translateX(-300px)";
    box.style.border = "2px solid black";
    box.style.textAlign = "center";
    box.style.backgroundColor = "#EAE8DD";

    box.innerHTML = text;

    body = document.getElementsByTagName("body")[0];

    body.appendChild(box);

    setTimeout(() => {
        var fade = setInterval(() => {
            if (!box.style.opacity) {
                box.style.opacity = 1;
            }
            if (box.style.opacity > 0) {
                box.style.opacity -= 0.1;
            } else {
                clearInterval(fade);
                document.querySelectorAll('.infobox').forEach(e => e.remove());
            }
        }, 30);
    }, duration);
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