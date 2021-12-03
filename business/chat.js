var chats = [];
const maxSavedMessages = 25;
const messageCharLimit = 127;

exports.openChat = function(chatid) {
    let chat = {
        "chatid": chatid,
        "messages": [{"username": "server", "message": `Welcome to chat ${chatid}!`}]
    };
    chats.push(chat);
}

exports.messageChat = function(chatid, username, message) {

    if(validateMessage(message)) {
        let chat = exports.getChat(chatid);
        if(!chat) {
            exports.openChat(chatid);
            chat = exports.getChat(chatid);
        }
        chat.messages.push({
            "username": username,
            "message": message.slice(0, messageCharLimit)
        });
        if(chat.messages.length > maxSavedMessages) {
            chat.messages.shift();
        }
    }
    
}

exports.getChat = function(chatid) {
    let response = false;
    chats.forEach(chat => {
        if(chat.chatid == chatid) {
            response = chat;
        }
    });
    return response;
}

function validateMessage(message) {
    //sorry to anyone who wanted to send <3 or </3 or anything like that
    if(message.includes('<') || message.includes('>') || message.includes('&lt;') || message.includes('&gt;')) {
        return false;
    }

    return true;
}