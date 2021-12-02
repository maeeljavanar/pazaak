var chatid;

function createChat(id) {
    chatid = id;
    $('#chat').append(`<div id="messages"></div>
    <div id="sendMessage">
      <input type="text" name="message" id="message" size="30" class="left"/>
      <button onclick="sendChat()" class="right">Send</button>
    </div>`);
}

function updateChat() {
    $.post(`${backendUrl}/chat/`, {"chatid": chatid}, chat => {
        $('#messages').children().remove();

        chat.messages.forEach(chatMessage => {
            let message = `<p><span class="chatUsername">${chatMessage.username}:</span> ${chatMessage.message}</p>`;
            $('#messages').append(message);
        });
    });
}

function sendChat() {
    let message = $('#message').val();
    $('#message').val('');
    console.log("Message: ", message);
    $.post(`${backendUrl}/chat/message`, {
        "token": window.sessionStorage.authToken,
        "chatid": chatid,
        "message": message
    });
}