const { Router } = require("express")
const render = require("../helpers/renderHelper")
const bodyParser = require("body-parser");
const app = require('../app')

const accountRouter = new Router()

const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});
accountRouter.use(urlencodedParser);

accountRouter.get("/register", (req, res) => {
  renderRegister(req, res);
});

accountRouter.post("/login", async (req, res) => {
  const { login, password } = req.body;

  await app.then(app => app.logIn({ login, password }, (err, result) => {
    if (err) {
      addMessage(req, "danger", err.message);
      renderLogin(req, res);
    } else {
      req.session.userID = result;
      req.session.save();
      res.redirect("/");
    }
  }));
});

accountRouter.get("/login", (req, res) => {
  console.log(req.session);
  renderLogin(req, res);
});

accountRouter.get("/logOut", (req, res) => {
  delete req.session.userID;
  req.session.save();
  res.redirect("/");
});

accountRouter.post("/register", urlencodedParser, async (req, res) => {
  const { login, password, password_confirm } = req.body;

  await app.then(app => app.register(
    {
      login: login,
      password: password,
      password_confirmation: password_confirm,
    },
    (err, result) => {
      if (err) {
        if (err instanceof ValidationError) {
          for (const message of err.messages) {
            addMessage(req, "danger", message);
          }
        } else {
          addMessage(req, "danger", err.message);
        }
        renderRegister(req, res);
      } else {
        addMessage(req, "success", "User created.");
        req.session.save();
        res.redirect("/login");
      }
    }
  ));
});

function renderLogin(req, res) {
  render(req, res, "login", "login",false);
}

function renderRegister(req, res) {
  render(req, res, "register", "register",false);
}

module.exports = accountRouter
