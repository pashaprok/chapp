const URL = window.location.href.split('/')
const socket = io();
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const me = await currentUser();
    if (input.value) {
        socket.emit('send-private-message', input.value, me);
        input.value = '';
    }
});

function newEvent(evType, msg) {
    const item = document.createElement('li');
    const msgBlock = document.createElement('div');
    item.appendChild(msgBlock);
    msgBlock.classList.add('message');
    msgBlock.classList.add(evType);
    msgBlock.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

socket.on("connect", async () => {
    const me = await currentUser();
    if(me) {
        socket.emit('join-private', URL[URL.length-1], me);
    }
});

socket.on('private-chat-info', function (msg) {
    newEvent('chat-info', msg);
});

socket.on('receive-private-message', async function (msg, sender) {
    const me = await currentUser()
    if(me._id === sender._id) {
        newEvent('my-msg', msg);
    } else {
        newEvent('other-msg', msg);
    }
});