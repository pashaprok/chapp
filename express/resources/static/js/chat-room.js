const socket = io();
const messages = document.getElementById('messages');
const usersInChat = document.getElementById('users-in-chat');
const form = document.getElementById('form');
const input = document.getElementById('input');
const isTypingTxt = document.getElementById('is-typing');

let isTyping = false;

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const me = await currentUser();
    if (input.value) {
        socket.emit('send chat message', input.value, me);
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

socket.on("show users list", (names) => {
    const count = names.length;
    const list = names.join(', ');
    usersInChat.innerText = `Users in chat(${count}): ${list}`;
})

socket.on("connect", async () => {
    const me = await currentUser();
    if(me) {
        socket.emit('user join', me);
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

    socket.on('user-typing-show', (users) => {
        if(users.length) {
            const names = users.map(u=> u.name).join(', ');
            isTypingTxt.innerText = `${names} is typing...`;
        } else {
            isTypingTxt.innerText = '';
        }
    })
});

socket.on('chat info', function (msg) {
    newEvent('chat-info', msg);
});

socket.on('receive chat message', async function (msg, sender) {
    const me = await currentUser()
    if(me._id === sender._id) {
        newEvent('my-msg', msg);
    } else {
        newEvent('other-msg', msg);
    }
});