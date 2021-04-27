const { Router } = require("express");
const cors = require("cors");
const app = require("../app");
const render = require("../helpers/renderHelper");
const { addMessage, messageTypes } = require("../helpers/popupMessageHelper");

const stockRouter = new Router();

stockRouter.get("/search", async (req, res) => {
  const query = req.query.query
  const results = await app.then((app) => app.search(query))
  if (results.results.length === 0) {
    addMessage(req, messageTypes.INFO, "No results found")
  }
  render(req, res,"search", `Search "${query}"`, true, results)
})

let corsOptions = {
  origin: ["https://www.jsdelivr.com/", "https://www.chartjs.org"],
  optionsSuccessStatus: 200,
};
stockRouter.options("*", cors());
stockRouter.get("/:symbol", cors(corsOptions), async (req, res) => {
  let symbol = req.params.symbol;
  let info = await app.then((app) => app.getStockInfo(symbol, req.session.userID))
  render(req, res, "stock", `Stock info: ${symbol}`, true, info);
});

stockRouter.post("/buy", async (req, res) => {
  const symbol = req.body.symbol;
  const amount = req.body.amount;
  await app.then((app) => app.buy({symbol, amount, user: req.session.userID}))
  .then(result => {
    addMessage(req, messageTypes.SUCCESS, 'Shares bought successfully')
  })
  .catch(err => {
    addMessage(req, messageTypes.DANGER, "Can't buy shares")
  })
  .finally(() => {
    res.redirect("/")
  })
})

stockRouter.post("/sell", async (req, res) => {
  const symbol = req.body.symbol;
  const amount = req.body.amount;
  await app.then((app) => app.sell({symbol, amount, user: req.session.userID}))
  .then(result => {
    addMessage(req, messageTypes.SUCCESS, 'Shares sold successfully')
  })
  .catch(err => {
    addMessage(req, messageTypes.DANGER, "Can't sell shares")
  })
  .finally(() => {
    res.redirect("/")
  })
})

module.exports = stockRouter;