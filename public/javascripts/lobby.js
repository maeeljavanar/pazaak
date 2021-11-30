$(document).ready(function() {
    $.getJSON(`${backendUrl}/gameList`, games => {
        console.log('GameList response returned');
        let gamesList = '';
        games.forEach(game => {
            gamesList += `<div class="game" id="game${game.gameid}">`;
            gamesList += `<p id="host${game.hostid}">Host: ${game.hostuser}</p>`;
            gamesList += `</div>`;
        });
    
        $('#gamelist').append(gamesList);
    });

    /**
     * Locked behind login
     */
    
    if(window.sessionStorage.authToken && window.sessionStorage.authToken != 'undefined') {

        //get user's active games
        $.post(`${backendUrl}/myGames`, {"token": window.sessionStorage.authToken}, games => {
            console.log('GameList response returned');
            let gamesList = '';
            games.forEach(game => {
                gamesList += `<div class="game" id="game${game.gameid}" onclick="loadGame(${game.gameid})">`;
                gamesList += `<p id="host${game.hostid}">Host: ${game.hostuser}        Guest: ${game.guestuser}</p>`;
                gamesList += `</div>`;
            });
        
            $('#myGames').append(gamesList);
        });

        //Show create lobby button
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
            loadGame(response.gameid);
        } else {
            alert("Error creatng game");
        }
    });
}

function loadGame(gameid) {
    window.location.replace(`./game?id=${gameid}`);
}