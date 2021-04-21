const { Sequelize, Transaction } = require("sequelize");
const SymbolModel = require("./models/Symbol");
const UserModel = require("./models/User");
const TransactionModel = require("./models/Transaction");
const { IEXCloudClient } = require("node-iex-cloud");
const fetch = require("node-fetch");
const symbolService = require("./services/symbolService")

const {register, logIn} = require('./services/userService')

const config = require('./config');
const { buy, lookup, history } = require("./services/stockService");

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
    }
  }

  search(query) {
    return {
      count: 2,
      results: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: '41.21',
          url: '/stock/aapl'
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          price: '20.21',
          url: '/stock/tsla'
        }
      ]
    }
  }
}

App.prototype.register = register
App.prototype.logIn = logIn
App.prototype.buy = buy
App.prototype.lookup = lookup
App.prototype.history = history

module.exports = App.start(config)
