const URL = window.location.href.split('/')
const socket = io();
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const isTypingTxt = document.getElementById('is-typing');

let isTyping = false;

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

    function inputOut() {
        isTyping = false;
        socket.emit('user-typing', me, isTyping);
    }

    input.oninput = () => {
        isTyping = true;
        socket.emit('user-typing', me, isTyping);
        setTimeout(inputOut, 2000);
    }

    socket.on('user-typing-show', (user, isTypingNow) => {
        isTypingTxt.innerText = isTypingNow ? `${user.name} is typing...` : '';
    })
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