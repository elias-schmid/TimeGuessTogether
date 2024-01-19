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
    hostPartyElement.addEventListener("click", () => {joinParty();})

    linksWrap.innerHTML = "";
    
    linksWrap.style.flexDirection = "column";

    linksWrap.appendChild(hostPartyElement);
    linksWrap.appendChild(joinPartyElement);
}

function hostParty() {
    if(getCookieValue("party_server") === null) {
        document.cookie = `party_server=${prompt("Enter Party Server", "Format: https://<domain>:<port>")}`;
    }

    var server_url = getCookieValue("party_server");

    var party_code = "";
    fetch(server_url+"/api/hostParty", {
        method: 'get',
        mode: 'cors',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
    .then(response => response.json())
    .then(json => party_code = json.data.party_code);

    var center_container = document.getElementsByClassName('centre')[0];
    center_container.innerHTML = `<h1>Code: ${party_code}</h1><h2>Waiting for other Players...</h2>`;
}

function joinParty() {

}

function getCookieValue(cookie) {
    re = new RegExp(`^(?:.*;)?\\s*${cookie}\\s*=\\s*([^;]+)(?:.*)?$`);
    return (document.cookie.match(re)||[,null])[1];
}