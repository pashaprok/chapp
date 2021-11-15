const socket = io();
const messages = document.getElementById('messages');
const usersInChat = document.getElementById('users-in-chat');
const form = document.getElementById('form');
const input = document.getElementById('input');
const isTypingTxt = document.getElementById('is-typing');

let isTyping = false;
form.addEventListener('submit', (e) => sendMessage(e, 'send chat message'));
socket.on("connect", async () => {
    const me = await currentUser();
    socket.emit('user join', me);
});
socket.on("show users list", (names) => showUsersInGeneral(names));
input.oninput = () => userTyping();
socket.on('user-typing-show', (users) => showTypingGeneral(users));
socket.on('chat info', (msg) => chatInfo(msg));
socket.on('receive chat message', (msg, sender, time) => ReceiveMessage(msg, sender, time));
socket.on('receive-general-messages-from-db', (msgs) => ReceiveMsgsFromDB(msgs));