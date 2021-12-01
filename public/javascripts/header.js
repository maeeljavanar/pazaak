//frontend js config since this should be included in all pages
const backendUrl = '//localhost:8080';

$(document).ready(function() {
    let header = `<header><h1><a href="./">${$('title').text()}</a></h1>`;
    if(window.sessionStorage.authToken && window.sessionStorage.authToken != 'undefined') {
        header += `<span><a href="./logout">Logout</a></span>`;
        header += `<span>Logged in as ${window.sessionStorage.username}</span>`
    } else {
        header += `<span><a href="./signup">Sign Up</a></span>`;
        header += `<span><a href="./login">Login</a></span>`;
    }
    header += `</header>`;

    $("body").prepend(header);
});