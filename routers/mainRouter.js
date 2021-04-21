const { Router } = require("express");
const render = require("../helpers/renderHelper");
const bodyParser = require("body-parser");
const app = require("../app");

const router = new Router();


const urlencodedParser = bodyParser.urlencoded({
    extended: false,
  });
  router.use(urlencodedParser);

router.get("/", (req, res) => {
  // TODO: get acc info
  render(req, res, "main", "home", true, {
    accountInfo: {
      total: 100,
      transactions: [
        {
          symbol: "asd",
          name: "Apple",
          shares: 12,
          price: "123",
          total: "1234",
          time: new Date().toLocaleString(),
        },
      ],
    },
  });
});

router.get("/history", (req, res) => {
  // TODO: get history
  render(req, res, "history", "History", true, {
    accountInfo: {
      total: 100,
      transactions: [
        {
          symbol: "asd",
          name: "Apple",
          shares: 12,
          price: "123",
          total: "1234",
          time: new Date().toLocaleString(),
        },
      ],
    },
  });
});


router.get("/register", (req, res) => {
  renderRegister(req, res);
});

router.post("/login", async (req, res) => {
  const { login, password } = req.body;

  await app
    .then(app => 
      app.logIn({ login, password })
    )
    .then((result) => {
      req.session.userID = result;
      req.session.save();
      res.redirect("/");
    })
    .catch((err) => {
      addMessage(req, "danger", err.message);
      renderLogin(req, res);
    });
});

router.get("/login", (req, res) => {
  console.log(req.session);
  renderLogin(req, res);
});

router.get("/logOut", (req, res) => {
  delete req.session.userID;
  req.session.save();
  res.redirect("/");
});

router.post("/register", urlencodedParser, async (req, res) => {
  const { login, password, password_confirm } = req.body;

  await app
    .then(app =>
      app.register({
        login: login,
        password: password,
        password_confirmation: password_confirm,
      })
    )
    .then((result) => {
      addMessage(req, "success", "User created.");
      req.session.save();
      res.redirect("/login");
    })
    .catch((err) => {
      if (err instanceof ValidationError) {
        for (const message of err.messages) {
          addMessage(req, "danger", message);
        }
      } else {
        addMessage(req, "danger", err.message);
      }
      renderRegister(req, res);
    });
});

function renderLogin(req, res) {
  render(req, res, "login", "login", false);
}

function renderRegister(req, res) {
  render(req, res, "register", "register", false);
}

module.exports = router;
