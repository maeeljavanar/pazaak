const gameid = window.location.search.slice(window.location.search.indexOf('id=') + 3); //should do something more formal than this in case anything else can be after id

console.log("Game id: ", gameid);