$(document).ready(function() {
    /**
     * Locked behind login
     */
    
    if(window.sessionStorage.authToken && window.sessionStorage.authToken != 'undefined') {

        //open games with joining
        $.getJSON(`${backendUrl}/gameList`, games => {
            console.log('GameList response returned');
            let gamesList = '';
            games.forEach(game => {
                gamesList += `<div class="game" id="game${game.gameid}" onclick="joinGame(${game.gameid})">`;
                gamesList += `<p id="host${game.hostid}">Host: ${game.hostuser}</p>`;
                gamesList += `</div>`;
            });
        
            $('#gamelist').append(gamesList);
        });

        //get user's active games
        $.post(`${backendUrl}/myGames`, {"token": window.sessionStorage.authToken}, games => {
            console.log('GameList response returned');
            let gamesList = '';
            games.forEach(game => {
                gamesList += `<div class="game" id="game${game.gameid}" onclick="loadGame(${game.gameid})">`;
                gamesList += `<pre><p id="host${game.hostid}">Host: ${game.hostuser}\t\t\t\tGuest: ${game.guestuser}</p></pre>`;
                gamesList += `</div>`;
            });

            if(gamesList == '') {
                gamesList = '<p>No active games</p>';
            }
        
            $('#myGames').append(gamesList);
        });

        //Show create lobby button
        $('#controls').append(`<div id="openGame"><p>Open Game</p></div>`);
        $('#openGame').click(openGame);

    /**
     * Fill in data for users before login
     */
    } else {
        //full game list with no joining
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

        $('#myGames').append('<p>Log in to view your games</p>');

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

function joinGame(gameid) {
    $.post(`${backendUrl}/joinLobby`, {"token": window.sessionStorage.authToken, "gameid": gameid}, response => {
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