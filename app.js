const { Sequelize } = require("sequelize");
const SymbolModel = require("./models/Symbol");
const UserModel = require("./models/User");
const TransactionModel = require("./models/Transaction");
const { IEXCloudClient } = require("node-iex-cloud");
const fetch = require("node-fetch");

const { register, logIn, currentCash } = require("./services/userService");

const config = require("./config");
const {
  buy,
  lookup,
  history,
  sell,
  info,
  getSharesCount,
} = require("./services/stockService");

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

  async getStockInfo(symbol, userID) {
    return {
      symbolData: await this.getStockCommonInfo(symbol),
      chartData: await this.getGraphData(symbol),
      userShares: await this.getSharesCount(symbol, userID.id),
    };
  }

  async getGraphData(symbol) {
    const iexChartResult = await this.iex
      .symbol(symbol)
      .chart("1m");
    return {
      data: iexChartResult.map((item) => {
        return {
          x: new Date(item.date).valueOf(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
        };
      }),
    };
  }

  async getStockCommonInfo(symbol) {
    const iexResults = await this.iex
      .symbol(symbol)
      .batch()
      .quote()
      .stats()
      .range("1m");
    console.log(iexResults);
    const isUp = iexResults.quote.change >= 0;
    return {
      symbol: iexResults.quote.symbol,
      companyName: iexResults.quote.companyName,
      isUp: isUp,
      price: iexResults.quote.latestPrice,
      marketCapitalization: iexResults.stats.marketcap,
      week52high: iexResults.stats.week52high,
      week52low: iexResults.stats.week52low,
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
        .company()
        .range("1m", iexSearchQueryResults.length);
      const results = iexSearchQueryResults.map((resultItem) => {
        const symbol = resultItem.symbol;
        const price = batchResults[symbol].price;
        const name = batchResults[symbol].company.companyName ?? resultItem.securityName;  // contains name not for all companies
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
App.prototype.getSharesCount = getSharesCount;

module.exports = App.start(config);
