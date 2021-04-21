const { Router } = require("express");
const cors = require("cors");
const app = require("../app");
const render = require("../helpers/renderHelper");
const { addMessage } = require("../helpers/popupMessageHelper");

const stockRouter = new Router();

stockRouter.get("/search", async (req, res) => {
  const query = req.query.query
  const results = await app.then((app) => app.search(query))
  render(req, res,"search", `Search "${query}"`, true, results)
})

let corsOptions = {
  origin: ["https://www.jsdelivr.com/", "https://www.chartjs.org"],
  optionsSuccessStatus: 200,
};
stockRouter.options("*", cors());
stockRouter.get("/:symbol", cors(corsOptions), async (req, res) => {
  let symbol = req.params.symbol;
  let info = await app.then((app) => app.getStockInfo(symbol))
  render(req, res, "stock", `Stock info: ${symbol}`, true, info);
});

stockRouter.post("/buy", async (req, res) => {
  const symbol = req.body.symbol;
  const amount = req.body.amount;
  await app.then((app) => app.buy({symbol, amount, user: req.session.userID}))
  .then(result => {
    addMessage(req, 'success', 'Shares bought successfully')
  })
  .catch(err => {
    addMessage(req, 'error', "Can't bur shares")
  })
  .finally(() => {
    res.redirect("/")
  })
})

module.exports = stockRouter;