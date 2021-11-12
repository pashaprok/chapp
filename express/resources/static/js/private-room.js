const URL = window.location.href.split('/')
const socket = io();
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const isTypingTxt = document.getElementById('is-typing');

let isTyping = false;
form.addEventListener('submit', (e) => sendMessage(e, 'send-private-message'));
socket.on("connect", () => socket.emit('join-private', URL[URL.length-1], me));
input.oninput = () => userTyping();
socket.on('user-typing-show', (u, isTypingNow) => showTypingPrivate(u, isTypingNow));
socket.on('private-chat-info', (msg) => chatInfo(msg));
socket.on('receive-private-message', (msg, sender, time) => ReceiveMessage(msg, sender, time, 'private'));
socket.on('receive-private-messages-from-db', (msgs) => ReceiveMsgsFromDB(msgs, 'private'));