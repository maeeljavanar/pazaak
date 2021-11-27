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
});