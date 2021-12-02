const gameid = window.location.search.slice(window.location.search.indexOf('id=') + 3); //should do something more formal than this in case anything else can be after id
const activatedColor = '#CC3B3B';
const deactivatedColor = '#5D606B';
const cardWidth = '100px';
const cardHeight = '150px';
const svgns = "http://www.w3.org/2000/svg";
const tableCardColor = 'green';
const positiveCardColor = 'blue';
const negativeCardColor = 'red';

$(document).ready(function() {

    createChat(gameid);
    setInterval(updateChat, 500);
    setInterval(getGameState, 1000);
    //getGameState();

});

function getGameState() {
    $.post(`${backendUrl}/gameStatus`, {"token": window.sessionStorage.authToken, "gameid": gameid}, response => {
        if(response.success) {
            updateGame(response.game);
        } else {
            alert("Error updating game");
        }
    });
}

//this function contains the code to actually update the screen
function updateGame(game) {

    //remove generated elements
    $(".generated").remove();

    //update names
    $('#playerName').html(game.playername);
    if(game.enemyname) {
        $('#enemyName').html(game.enemyname);
    }

    //update turn
    if(game.turn) {
        $('#playerTurn').attr('fill', activatedColor);
        $('#enemyTurn').attr('fill', deactivatedColor);
    } else {
        $('#playerTurn').attr('fill', deactivatedColor);
        $('#enemyTurn').attr('fill', activatedColor);
    }

    //update player sets
    for(let i = 0; i < 3; i++) {
        if(i < game.points) {
            $(`#playerSet${i}`).attr('fill', activatedColor);
        } else {
            $(`#playerSet${i}`).attr('fill', deactivatedColor);
        }
    }

    //update enemy sets
    for(let i = 0; i < 3; i++) {
        if(i < game.enemypoints) {
            $(`#enemySet${i}`).attr('fill', activatedColor);
        } else {
            $(`#enemySet${i}`).attr('fill', deactivatedColor);
        }
    }

    //update player table
    game.table.forEach((card, index) => {
        let tableSlot = $(`#playerTable${index}`);
        createCard(tableSlot.attr('x'), tableSlot.attr('y'), card, false);
    });

    //update enemy table
    game.enemyTable.forEach((card, index) => {
        let tableSlot = $(`#enemyTable${index}`);
        createCard(tableSlot.attr('x'), tableSlot.attr('y'), card, false);
    });

    //update player hand
    game.hand.forEach((card, index) => {
        let handSlot = $(`#playerHand${index}`);
        createCard(handSlot.attr('x'), handSlot.attr('y'), card, game.turn);
    });

    //update enemy hand
    for(let i = 0; i < game.enemyHand.cards; i++) {
        let handSlot = $(`#enemyHand${i}`);
        createCard(handSlot.attr('x'), handSlot.attr('y'), 'u ', false);
    }

    //update count of cards on table
    $('#playerCount').html(count(game.table));
    $('#enemyCount').html(count(game.enemyTable));

    //add clickables if players turn
    if(game.turn) {

        //end turn
        createButton($('#endTurn').attr('x'), $('#endTurn').attr('y'), $('#endTurn').attr('width'), $('#endTurn').attr('height'), 'endTurn');

        //stand
        createButton($('#stand').attr('x'), $('#stand').attr('y'), $('#stand').attr('width'), $('#stand').attr('height'), 'stand');

        //forfeit
        createButton($('#forfeit').attr('x'), $('#forfeit').attr('y'), $('#forfeit').attr('width'), $('#stand').attr('height'), 'forfeit');

    }
}

//Helper to count values of cards on the table
function count(table) {
    let count = 0;

    table.forEach(card => {
        let type = card.charAt(0);
        let val = parseInt(card.charAt(1));

        if(type == 't' || type == 'p') {
            count += val;
        } else if(type == 'n') {
            count -= val;
        }
    });

    return count;
}

function createButton(x, y, width, height, action) {
    let button = document.createElementNS(svgns, "rect");

    button.setAttribute("x", x);
    button.setAttribute("y", y);
    button.setAttribute("width", width);
    button.setAttribute("height", height);
    button.setAttribute("onclick", `takeAction('${action}')`);
    button.setAttribute("fill", "rgba(0, 0, 0, 0");

    $("#cards").append(button);
}

//create and draw a card
function createCard(x, y, code, playable) {
    
    //split values of the code
    let type = code.charAt(0);
    let value = code.charAt(1);

    //create card object
    let card = document.createElementNS(svgns, "g");
    card.setAttribute("class", "generated");
    card.setAttribute("code", code);
    if(playable) {
        card.setAttribute("onclick", `playCard('${code}')`);
    }

    //create background
    let background = document.createElementNS(svgns, "rect");
    background.setAttribute("x", x);
    background.setAttribute("y", y);
    background.setAttribute("width", cardWidth);
    background.setAttribute("height", cardHeight);

    //card type specifics
    if(type == 't') {
        //table card
        background.setAttribute("fill", tableCardColor);

    } else if (type == 'p') {
        //positive hand card
        background.setAttribute("fill", positiveCardColor);

    } else if (type == 'n') {
        //negative hand card
        background.setAttribute("fill", negativeCardColor);

    } else if (type == 's') {
        //switch card
        background.setAttribute("fill", "black"); //TODO switch card implementation
    } else if (type == 'u') {
        //unknown card in enemy hand
        background.setAttribute("fill", "black"); //TODO switch card implementation
    }

    //add number
    let number = document.createElementNS(svgns, "text");
    number.setAttribute("class", "cardNumber");
    number.setAttribute("x", (parseInt(x) + 20) + 'px');
    number.setAttribute("y", (parseInt(y) + parseInt(cardHeight) - 30) + 'px');
    number.innerHTML = value;


    card.appendChild(background);
    card.appendChild(number);

    $("#cards").append(card);

    console.log("Card added with code ", code);
}

//play card with passed code
function playCard(code) {
    $.post(`${backendUrl}/gameAction`, {
        "token": window.sessionStorage.authToken, 
        "action": 'play',
        "gameid": gameid,
        "card": code
    }, response => {
        console.log(response);
    });
}

function takeAction(action) {
    console.log('Action: ', action);
    $.post(`${backendUrl}/gameAction`, {
        "token": window.sessionStorage.authToken, 
        "action": action,
        "gameid": gameid
    }, response => {
        console.log(response);
    });
}