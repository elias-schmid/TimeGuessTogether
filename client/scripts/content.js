var partyLinkElement = document.createElement("a");
partyLinkElement.innerHTML = "Party";

var linksWrap = document.getElementById('linksWrap');

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
    hostPartyElement.addEventListener("click", () => {hostParty();})
    var joinPartyElement = document.createElement("a");
    joinPartyElement.innerHTML = "Join existing Party";
    joinPartyElement.addEventListener("click", () => {joinParty();})

    linksWrap.innerHTML = "";
    
    linksWrap.style.flexDirection = "column";

    linksWrap.appendChild(hostPartyElement);
    linksWrap.appendChild(joinPartyElement);
}

function hostParty() {
    var server_url = getPartyServer();

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
        center_container.innerHTML = `<h1>Code: ${party_code}</h1><h2>Waiting for other Players...</h2>`;
    });

}

function joinParty() {
    var server_url = getPartyServer();
    var party_code = prompt("Enter Party Code:");

    game_link = "";
    fetch(server_url+"/api/joinParty", {
        method: 'post',
        body: JSON.stringify({"party_code": party_code}),
        mode: 'cors',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    .then(response => response.json())
    .then(json => game_link = json.data.game_link);

    window.location = game_link;
}

function getPartyServer() {
    var cookie_name = "party_server";
    var re = new RegExp(`^(?:.*;)?\\s*${cookie_name}\\s*=\\s*([^;]+)(?:.*)?$`);
    var value = (document.cookie.match(re)||[,null])[1];
    if(value === null) {
        document.cookie = `${cookie_name}=${prompt("Enter Party Server", "Format: https://<domain>:<port>")}`;
    }
    return value;
}