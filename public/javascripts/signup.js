function register() {
    let username = $("#username").val();
    let password = $("#password").val();
    $.post(`${backendUrl}/createAccount`, {"username": username, "password": password}, response => {
        if(response.success) {
            window.sessionStorage.authToken = response.token;
            let token = parseJwt(response.token);
            window.sessionStorage.username = token.name;
            window.location.replace('./');
        }
    });
}

//courtesy of https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};