const gameid = window.location.search.slice(window.location.search.indexOf('id=') + 3); //should do something more formal than this in case anything else can be after id
const activatedColor = '#CC3B3B';
const deactivatedColor = '#5D606B';
const cardWidth = '100px';
const cardHeight = '150px';
const svgns = "http://www.w3.org/2000/svg";
const tableCardColor = 'green';
const positiveCardColor = 'blue';
const negativeCardColor = 'red';
var switchVals = ['p', 'p', 'p', 'p'];

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

    //game over
    if(game.winner) {
        alert(`${game.winner} has won the game!`);
        window.location.replace('./');
    }

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
        createCard(handSlot.attr('x'), handSlot.attr('y'), card, game.turn, index);
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
            //t0 represents a 10 table card - there are no 0s and no hand 10s
            if(val == 0) {
                count += 10;
            } else {
                count += val;
            }
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
function createCard(x, y, code, playable, index) {
    
    //split values of the code
    let type = code.charAt(0);
    let value = code.charAt(1);

    //t0 is actually a 10
    if(value == '0') {
        value = '10';
    }

    //create card object
    let card = document.createElementNS(svgns, "g");
    card.setAttribute("class", "generated");
    card.setAttribute("code", code);
    if(playable) {
        card.setAttribute("onclick", `playCard('${code}', ${index})`);
    }

    //create background
    let background = document.createElementNS(svgns, "rect");
    let switchBackground;
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
        switchBackground = document.createElementNS(svgns, "rect");
        switchBackground.setAttribute("x", x);
        switchBackground.setAttribute("y", parseInt(y) + (parseInt(cardHeight) / 2) + 'px');
        switchBackground.setAttribute("width", cardWidth);
        switchBackground.setAttribute("height", (parseInt(cardHeight) / 2));

        //do background colors
        if(switchVals[index] == 'p') {
            background.setAttribute("fill", positiveCardColor);
            switchBackground.setAttribute("fill", negativeCardColor);
        } else {
            background.setAttribute("fill", negativeCardColor);
            switchBackground.setAttribute("fill", positiveCardColor);
        }

        //add flip button
        let flipTile = $(`#playerHandFlip${index}`);
        
        //text
        let flipText = document.createElementNS(svgns, "text");
        flipText.setAttribute("x", parseInt(flipTile.attr("x")) + 30 + 'px ');
        flipText.setAttribute("y", parseInt(flipTile.attr("y")) + 30 + 'px' );
        flipText.innerHTML = "Flip";

        //clickable
        let flipButton = document.createElementNS(svgns, "rect");
        flipButton.setAttribute("x", flipTile.attr("x"));
        flipButton.setAttribute("y", flipTile.attr("y"));
        flipButton.setAttribute("width", flipTile.attr("width"));
        flipButton.setAttribute("height", flipTile.attr("height"));
        flipButton.setAttribute("onclick", `switchCard(${index})`);
        flipButton.setAttribute("fill", "rgba(0, 0, 0, 0");

        //add flip button to dom
        $("#cards").append(flipText);
        $("#cards").append(flipButton);


    } else if (type == 'u') {
        //unknown card in enemy hand
        background.setAttribute("fill", "black");
    }

    //add number
    let number = document.createElementNS(svgns, "text");
    number.setAttribute("class", "cardNumber");
    number.setAttribute("y", (parseInt(y) + parseInt(cardHeight) - 30) + 'px');
    //adjust position for wider value
    if(value == '10') {
        number.setAttribute("x", (parseInt(x)) + 'px');
        number.setAttribute("textLength", parseInt(cardWidth) - 5 + 'px');
    } else {
        number.setAttribute("x", (parseInt(x) + 20) + 'px');
    }
    number.innerHTML = value;


    card.appendChild(background);
    if(type == 's') {
        card.appendChild(switchBackground);
    }
    card.appendChild(number);

    $("#cards").append(card);

    console.log("Card added with code ", code);
}

function switchCard(index) {
    if(switchVals[index] == 'p') {
        switchVals[index] = 'n';
    } else {
        switchVals[index] = 'p';
    }
}

//play card with passed code
function playCard(code, index) {
    let data = {
        "token": window.sessionStorage.authToken, 
        "action": 'play',
        "gameid": gameid,
        "card": code
    };

    //include switch if switch card
    if(code.charAt(0) == 's') {
        data.switch = switchVals[index];
    }
    $.post(`${backendUrl}/gameAction`, data, response => {
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