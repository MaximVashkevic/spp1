const App = require('./app')
const express = require('express')
const config = require('./config');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const session = require('express-session')

const ValidationError = require('./validationError');

(async () => {
    const app = await App.start(config)

    const server = express()
    server.use(express.static(__dirname + '/static'))
    server.set('view engine', 'ejs')
    server.use(bodyParser.json());
    const urlencodedParser = bodyParser.urlencoded({
        extended: false,
    })
    server.use(urlencodedParser)
    server.use(cookieParser())
    server.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
    }))

    server.use((req, res, next) => {
        if (!req.session.messages) {
            req.session.messages = []
        }

        next()
    })

    server.get('/', (req, res) => {
        res.send('Main')
    })

    server.post('/register', urlencodedParser, async (req, res) => {
        const { login, password, password_confirm } = req.body

        app.register(
            {
                login: login,
                password: password,
                password_confirmation: password_confirm,
            },
            (err, result) => {
                if (err) {
                    if (err instanceof ValidationError) {
                        for (const message of err.messages) {
                            addMessage(req, "danger", message)
                        }
                    }
                    else {
                        addMessage(req, "danger", err.message)
                    }
                    renderRegister(req, res);
                }
                else {
                    addMessage(req, "success", "User created.");
                    req.session.save();
                    res.redirect('/login')
                }
            });

    })

    server.get('/register', (req, res) => {
        renderRegister(req, res);
    })

    server.post('/login', (req, res) => {
        const { login, password } = req.body

        app.logIn({ login, password }, (err, result) => {
            if (err) {
                addMessage(req, "danger", err.message);
                renderLogin(req, res)
            }
            else {
                // !!!
                res.redirect('/')
            }
        })
    })

    server.get('/login', (req, res) => {
        console.log(req.session)
        renderLogin(req, res);
    })

    server.listen(3000, () => console.log("listening"))
})()

function addMessage(req, type, text) {
    req.session.messages.push({ type, text })
}

function clearMessages(req) {
    req.session.messages = []
    req.session.save()
}

function render(req, res, title, isAuthorized) {
    res.render(title, { title, isAuthorized, messages: req.session.messages })
    clearMessages(req)
}

function renderRegister(req, res) {
    render(req, res, 'register', false);
}

function renderLogin(req, res) {
    render(req, res, 'login', false)
}