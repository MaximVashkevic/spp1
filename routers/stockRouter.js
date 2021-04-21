const { Router } = require("express");
const cors = require("cors");
const app = require("../app");
const render = require("../helpers/renderHelper")

const searchRouter = new Router();

searchRouter.get("/search", async (req, res) => {
  const query = req.query.query
  const results = await app.then((app) => app.search(query))
  render(req, res,"search", `Search "${query}"`, true, results)
})

let corsOptions = {
  origin: ["https://www.jsdelivr.com/", "https://www.chartjs.org"],
  optionsSuccessStatus: 200,
};
searchRouter.options("*", cors());
searchRouter.get("/:symbol", cors(corsOptions), async (req, res) => {
  let symbol = req.params.symbol;
  let info = await app.then((app) => app.getStockInfo(symbol))
  render(req, res, "stock", `Stock info: ${symbol}`, true, info);
});

module.exports = searchRouter;