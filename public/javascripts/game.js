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
    setInterval(getGameState, 200);
    //getGameState();

});

function getGameState() {
    $.post(`${backendUrl}/gameStatus`, {"token": window.sessionStorage.authToken, "gameid": gameid}, response => {
        if(response.success) {
            updateGame(response.game);
        } else {
            if(response.code && response.code == 'gdne') {
                window.location.replace('./');
            } else {
                alert(game.error);
            }
            
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
        let handSlot = $(`#playerHandSlot${index}`);
        createCard(handSlot.attr('x'), handSlot.attr('y'), card, game.turn, index);
    });

    if(game.hand.length < 4) {
        for(let i = 3; i > 0 && i >= game.hand.length; i--) {
            $(`#playerHandFlip${i}`).attr("onclick", '');
            $(`#playerHandFlip${i} .flipCover`).attr("fill", "#191919");
        }
    }

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
        setClickable('endTurn');

        //stand
        setClickable('stand');

        //forfeit
        setClickable('forfeit');

    //otherwise make unclickable
    } else {
        //end turn
        setUnclickable('endTurn');

        //stand
        setUnclickable('stand');

        //forfeit
        setUnclickable('forfeit');
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

function setClickable(action) {
    $(`#${action}`).attr("onclick", `takeAction('${action}')`);
    $(`#${action}`).attr("class", "svgButton");
}

function setUnclickable(action) {
    $(`#${action}`).attr("onclick", '');
    $(`#${action}`).attr("class", "disabledSvgButton");
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

    //create background (and duplicate foreground so the number isn't being weird about clicks)
    let background = document.createElementNS(svgns, "rect");
    let switchBackground;
    background.setAttribute("x", x);
    background.setAttribute("y", y);
    background.setAttribute("width", cardWidth);
    background.setAttribute("height", cardHeight);

    let foreground = document.createElementNS(svgns, "rect");
    foreground.setAttribute("x", x);
    foreground.setAttribute("y", y);
    foreground.setAttribute("width", cardWidth);
    foreground.setAttribute("height", cardHeight);
    foreground.setAttribute("fill", "rgba(0, 0, 0, 0)");

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

    } else if (type == 'u') {
        //unknown card in enemy hand
        background.setAttribute("fill", "black");
    }

    //switch cards
    if (type == 's') {
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
        $(`#playerHandFlip${index}`).attr("onclick", `switchCard(${index})`);
        $(`#playerHandFlip${index} .flipCover`).attr("fill", "rgba(0, 0, 0, 0)");

    } else {
        $(`#playerHandFlip${index}`).attr("onclick", '');
        $(`#playerHandFlip${index} .flipCover`).attr("fill", "#191919");
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
    card.appendChild(foreground);

    if(playable) {
        $(`#playerHand${index}`).attr("onclick", `playCard('${code}', ${index})`);
        $(`#playerHand${index}`).append(card);
    } else {
        $("#cards").append(card);
    }

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