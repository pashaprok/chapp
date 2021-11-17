let me;

async function getMe() {
    me = await currentUser()
}
getMe();

function newEvent(evType, msg, time, sender) {
    const item = document.createElement('li');
    const msgBlock = document.createElement('div');
    item.appendChild(msgBlock);
    msgBlock.classList.add('message');
    msgBlock.classList.add(evType);

    function createMsgEl(cls, content) {
        const el = document.createElement('div');
        el.classList.add(cls);
        el.innerText = content;
        msgBlock.appendChild(el);
    }

    if (sender) createMsgEl('msg-author', sender);
    createMsgEl('msg-txt', msg);
    if (time) createMsgEl('msg-time', time);

    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

function ReceiveMsgsFromDB(list, privateChat) {

    for(let i=0; i<list.length;i++) {
        const txt =  list[i].txt;
        const time = new Date(list[i].msgDate).toLocaleTimeString();

        if(me._id === list[i].author._id) {
            newEvent('my-msg', txt, time);
        } else {
            if(privateChat === 'private') {
                newEvent('other-msg', txt, time);
            } else {
                newEvent('other-msg', txt, time, list[i].author.name);
            }
        }
    }
}

function ReceiveMessage(content, user, msgTime, privateChat) {
    if(me._id === user._id) {
        newEvent('my-msg', content, msgTime);
    } else {
        if(privateChat === 'private') {
            newEvent('other-msg', content, msgTime);
        } else {
            newEvent('other-msg', content, msgTime, user.name);
        }
    }
}

function chatInfo(txt) {
    newEvent('chat-info', txt);
}

function inputOut() {
    isTyping = false;
    socket.emit('user-typing', me, isTyping);
}

function userTyping() {
    isTyping = true;
    socket.emit('user-typing', me, isTyping);
    setTimeout(inputOut, 2000);
}

function showTypingGeneral(list) {
    if(list.length) {
        const names = list.map(u=> u.name).join(', ');
        isTypingTxt.innerText = `${names} is typing...`;
    } else {
        isTypingTxt.innerText = '';
    }
}

function showTypingPrivate(user, typing) {
    isTypingTxt.innerText = typing ? `${user.name} is typing...` : '';
}

function showUsersInGeneral(list) {
    const count = list.length;
    const names = list.join(', ');
    usersInChat.innerText = `Users in chat(${count}): ${names}`;
}

function sendMessage(e, target) {
    e.preventDefault();
    if (input.value) {
        socket.emit(target, input.value, me, new Date());
        input.value = '';
    }
}