$(document).ready(function() {
    $.getJSON(`${backendUrl}/gameList`, games => {
        console.log('GameList response returned');
        let gamesList = '';
        games.forEach(game => {
            gamesList += `<div class="game" id="game${game.gameid}"">`;
            gamesList += `<p id="host${game.hostid}">Host: ${game.hostuser}</p>`
            gamesList += `</div>`;
        });
    
        $('#gamelist').append(gamesList);
    });

    //if logged in, show create lobby button
    if(window.sessionStorage.authToken && window.sessionStorage.authToken != 'undefined') {
        $('#controls').append(`<div id="openGame"><p>Open Game</p></div>`);
        $('#openGame').click(openGame);
    } else {
        $('#controls').append(`<p>Log in to access lobby controls</p>`);
    }
});

function openGame() {
    $.post(`${backendUrl}/openLobby`, {"token": window.sessionStorage.authToken}, response => {
        console.log(response);
        if(response.success) {
            window.location.replace(`./game?id=${response.gameid}`);
        } else {
            alert("Error creatng game");
        }
    });
}