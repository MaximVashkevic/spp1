const User = require("../models/User");
const ValidationError = require("../validationError");
const TransactionValidator = require("../validators/transactionValidator");
async function buy(shareParams) {
  const db = this.db;
  const TransactionModel = db.models.Transaction;
  const SymbolModel = db.models.Symbol;
  const transactionValidator = TransactionValidator(shareParams);
  if (!transactionValidator.passes()) {
    throw new Error("Invalid symbol or amount of shares");
  }

  const symbolPrice = await this.lookup(shareParams.symbol);
  const total = symbolPrice * shareParams.amount;

  if (shareParams.user.amount - total < 0) {
    throw new Error("Not enough money");
  }

  const companyName = await getCompanyName(this.iex, shareParams.symbol);

  try {
    const result = await db.transaction(async (t) => {
      const [symbol, _] = await SymbolModel.findOrCreate({
        where: { symbol: shareParams.symbol },
        defaults: { symbol: shareParams.symbol, companyName },
        transaction: t,
      });

      await TransactionModel.create(
        {
          userId: shareParams.user.id,
          symbolId: symbol.id,
          shares: shareParams.amount,
          price: symbolPrice,
        },
        { transaction: t }
      );

      try {
        await User.findOne({ where: { id: shareParams.user.id } }).then(
          (user) => {
            user.amount -= total;
            return user.save({ transaction: t });
          }
        );
      } catch (err) {
        throw new Error("Server error");
      }
    });
    return result;
  } catch (err) {
    throw new Error("Server error");
  }
}

async function getSharesCount(symbol, userId) {
  const SymbolModel = this.db.models.Symbol;
  const TransactionModel = this.db.models.Transaction;

  return await SymbolModel.findOne({
    where: { symbol: symbol },
  }).then(async (symbol) => {
    if (symbol) {
      const shares = await TransactionModel.sum("shares", {
        where: { symbolId: symbol.id, userId: userId },
      });
      if (Number.isFinite(shares)) {
          return shares;
      }
    }
    return 0;
  });
}

async function sell(shareParams) {
  const db = this.db;
  const TransactionModel = db.models.Transaction;
  const SymbolModel = db.models.Symbol;
  const transactionValidator = TransactionValidator(shareParams);
  if (!transactionValidator.passes()) {
    throw new Error("Invalid symbol or amount of shares");
  }

  const symbolPrice = await this.lookup(shareParams.symbol);
  const total = symbolPrice * shareParams.amount;
  
  try {
    const result = await db.transaction(async (t) => {
      await SymbolModel.findOne({
        where: { symbol: shareParams.symbol },
      }).then(async (symbol) => {
        const totalShares = await TransactionModel.sum("shares", {
          where: { symbolId: symbol.id },
        });
        if (totalShares < shareParams.amount) {
          throw new ValidationError(["Not enough shares"]);
        }
        await TransactionModel.create(
          {
            userId: shareParams.user.id,
            symbolId: symbol.id,
            shares: -shareParams.amount,
            price: symbolPrice,
          },
          { transaction: t }
        );
        try {
            await User.findOne({ where: { id: shareParams.user.id } }).then(
              (user) => {
                user.amount += total;
                return user.save({ transaction: t });
              }
            );
          } catch (err) {
            throw new Error("Server error");
          }
      });
    });
    return result;
  } catch (err) {
    console.log(err);
    throw new Error("Can't sell shares");
  }
}

async function lookup(symbol) {
  try {
    return await this.iex.symbol(symbol).price();
  } catch (err) {
    return NaN;
  }
}

async function getCompanyName(iex, symbol) {
  try {
    const info = await iex.symbol(symbol).company();
    return info.companyName;
  } catch (err) {
    console.log(err);
    throw new Error("Invalid symbol" + symbol);
  }
}

async function info(params) {
  if (typeof params?.user === "undefined") {
    throw new Error("Invalid params");
  }
  const Transaction = this.db.models.Transaction;
  const Symbol = this.db.models.Symbol;
  const sequelize = this.db.queryInterface.sequelize;

  try {
    return await Transaction.findAll({
      where: { userId: params.user.id },
      include: [Symbol],
      group: ["symbolId"],
      attributes: {
        include: [[sequelize.fn("sum", sequelize.col("shares")), "sharessum"]],
      },
    }).then((res) => {
      return res.map((transaction) => {
        return {
          shares: transaction.get("sharessum"),
          symbol: transaction.Symbol.symbol,
          name: transaction.Symbol.companyName,
          price: transaction.price.toFixed(2),
          total: (transaction.price * transaction.get("sharessum")).toFixed(2),
        };
      }).filter(value => value.shares > 0);
    });
  } catch (err) {
    console.log(err);
    throw new Error("Can't get info");
  }
}

async function history(params) {
  if (typeof params?.user === "undefined") {
    throw new Error("Invalid params");
  }

  const Transaction = this.db.models.Transaction;
  const Symbol = this.db.models.Symbol;
  try {
    return Transaction.findAll({
      where: { userId: params.user.id },
      include: [Symbol],
    });
  } catch (err) {
    throw new Error("server error");
  }
}

module.exports = { buy, lookup, history, sell, info, getSharesCount };
