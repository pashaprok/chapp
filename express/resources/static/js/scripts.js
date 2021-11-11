const signupForm = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.btn-logout');

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

if (signupForm)
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signup(name, email, password);
    });

if (loginForm)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

async function login(email, password) {
    try {
        const res = await axios({
            method: 'POST',
            url: '/users/login',
            data: {
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            location.assign('/v1/my-profile');
        }
    } catch (err) {
        console.log(err);
    }
}

async function signup(name, email, password) {
    try {
        const res = await axios({
            method: 'POST',
            url: '/users/signup',
            data: {
                name,
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            location.assign('/v1/my-profile');
        }
    } catch (err) {
        console.log(err);
    }
}

async function currentUser() {
    try {
        const res = await axios({
            method: 'GET',
            url: '/users/my-profile',
        });

        if (res.data.status === 'success') {
            return res.data.data
        }
    } catch (err) {
        console.log(err);
    }
}

async function getUserById(id) {
    try {
        const res = await axios({
            method: 'GET',
            url: `/users/by-id/${id}`,
        });

        if (res.data.status === 'success') {
            return res.data.data
        }
    } catch (err) {
        console.log(err);
    }
}



async function logout() {
    try {
        const res = await axios({
            method: 'GET',
            url: '/users/logout',
        });

        if ((res.data.status = 'success')) location.assign('/v1/login');
    } catch (err) {
        console.log(err);
    }
}

