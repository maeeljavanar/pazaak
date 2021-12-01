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

    //setInterval(getGameState, 1000);
    getGameState();

});

function getGameState() {
    $.post(`${backendUrl}/gameStatus`, {"token": window.sessionStorage.authToken, "gameid": gameid}, response => {
        console.log(response);
        if(response.success) {
            updateGame(response.game);
        } else {
            alert("Error updating game");
        }
    });
}

function updateGame(game) {

    //remove generated elements
    $(".generated").remove();

    //update names
    $('#playerName').html(game.playername);
    $('#enemyName').html(game.enemyname);

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
        createCard(tableSlot.attr('x'), tableSlot.attr('y'), card);
    });

    //update enemy table
    game.enemyTable.forEach((card, index) => {
        let tableSlot = $(`#enemyTable${index}`);
        createCard(tableSlot.attr('x'), tableSlot.attr('y'), card);
    });

    //update player hand
    game.hand.forEach((card, index) => {
        let handSlot = $(`#playerHand${index}`);
        createCard(handSlot.attr('x'), handSlot.attr('y'), card);
    });

    //update enemy hand
    for(let i = 0; i < game.enemyHand.cards; i++) {
        let handSlot = $(`#enemyHand${i}`);
        createCard(handSlot.attr('x'), handSlot.attr('y'), 'u ');
    }

    //update count of cards on table
    $('#playerCount').html(count(game.table));
    $('#enemyCount').html(count(game.enemyTable));
}

//Helper to count values of cards on the table
function count(table) {
    let count = 0;

    table.forEach(card => {
        let type = card.charAt(0);
        let val = card.charAt(1);

        if(type == 't' || type == 'p') {
            count += val;
        } else if(type == 'n') {
            count -= val;
        }
    });

    return count;
}

function createCard(x, y, code) {
    
    //split values of the code
    let type = code.charAt(0);
    let value = code.charAt(1);

    //create card object
    let card = document.createElementNS(svgns, "g");
    card.setAttribute("class", "generated");
    card.setAttribute("code", code);

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