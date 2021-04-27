const { Sequelize, Transaction } = require("sequelize");
const SymbolModel = require("./models/Symbol");
const UserModel = require("./models/User");
const TransactionModel = require("./models/Transaction");
const { IEXCloudClient } = require("node-iex-cloud");
const fetch = require("node-fetch");
const symbolService = require("./services/symbolService");

const { register, logIn, currentCash } = require("./services/userService");

const config = require("./config");
const { buy, lookup, history, sell, info } = require("./services/stockService");

class App {
  db = null;
  iex = null;
  config = null;

  constructor(connection, iexClient, config) {
    this.db = connection;
    this.iex = iexClient;
    this.config = config;
  }

  static async start(config) {
    return (async () => {
      const sequelize = new Sequelize(config.connectionString);
      try {
        await sequelize.authenticate();
        UserModel.define(sequelize);
        SymbolModel.define(sequelize);
        TransactionModel.define(sequelize);
        await sequelize.sync();
      } catch (error) {
        return this.emit("error", error);
      }
      const iex = new IEXCloudClient(fetch, {
        sandbox: true,
        publishable: config.iexPublicKey,
        version: "stable",
      });

      const app = new App(sequelize, iex, config);

      return app;
    })();
  }

  getStockInfo(symbol) {
    return {
      symbolData: symbolService.getStockInfo(symbol),
      comments: symbolService.getComments(symbol),
      chartData: symbolService.getGraphData(symbol),
    };
  }

  async search(query) {
    try {
      const iexSearchQueryResults = await this.iex.search(query);
      const symbols = iexSearchQueryResults
        .map((resultItem) => resultItem.symbol)
        .join(",");

      const batchResults = await this.iex
        .batchSymbols(symbols)
        .batch()
        .price()
        // .company()
        .range("1m", iexSearchQueryResults.length);
      const results = iexSearchQueryResults.map((resultItem) => {
        const symbol = resultItem.symbol;
        const price = batchResults[symbol].price;
        const name = resultItem.securityName;
        // const name = batchResults[symbol].company.companyName;  // contains name not for all companies
        return {
          symbol: symbol,
          name: name,
          price: Number.isFinite(price) ? price.toFixed(2) : "Unknown",
          url: `/stock/${symbol}`,
        };
      });
      return {
        count: results.length,
        results: results,
      };
    } catch (err) {
      console.log(err);
      throw new Error("Can't search for stocks");
    }
  }
}

App.prototype.register = register;
App.prototype.logIn = logIn;
App.prototype.buy = buy;
App.prototype.sell = sell;
App.prototype.lookup = lookup;
App.prototype.history = history;
App.prototype.currentCash = currentCash;
App.prototype.info = info;

module.exports = App.start(config);
