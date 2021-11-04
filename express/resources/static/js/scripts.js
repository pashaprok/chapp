const signupForm = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.btn-logout');

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

