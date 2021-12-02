var chats = [];
const maxSavedMessages = 10;

exports.openChat = function(chatid) {
    let chat = {
        "chatid": chatid,
        "messages": [{"username": "server", "message": `Welcome to chat ${chatid}!`}]
    };
    chats.push(chat);
}

exports.messageChat = function(chatid, username, message) {
    let chat = exports.getChat(chatid);
    chat.messages.push({
        "username": username,
        "message": message
    });
    if(chat.messages.length > maxSavedMessages) {
        chat.messages.shift();
    }
}

exports.getChat = function(chatid) {
    let response;
    chats.forEach(chat => {
        if(chat.chatid == chatid) {
            response = chat;
        }
    });
    return response;
}