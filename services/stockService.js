const User = require("../models/User");
const BuyValidator = require("../validators/buyValidator");
async function buy(shareParams) {
  const db = this.db;
  const TransactionModel = db.models.Transaction;
  const SymbolModel = db.models.Symbol;
  const buyValidator = BuyValidator(shareParams);
  if (!buyValidator.passes()) {
    throw new Error("Invalid symbol or amount of shares");
  }

  const symbolPrice = await this.lookup(shareParams.symbol);
  const total = symbolPrice * shareParams.amount;

  if (shareParams.user.amount - total < 0) {
    throw new Error("Not enough money");
  }

  const companyName = await getCompanyName(this.iex, shareParams.symbol)

  try {
    const result = await db.transaction(async (t) => {
      const [symbol, _] = await SymbolModel.findOrCreate({
        where: { symbol: shareParams.symbol },
        defaults: { symbol: shareParams.symbol, companyName  },
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
          await User.findOne( {where: {id: shareParams.user.id}})
          .then(user => {
              user.amount -= total
              return user.save({ transaction: t })
            })
      } catch (err) {
        throw new Error("Server error");
      }
    });
    return result;
  } catch (err) {
    throw new Error("Server error");
  }
}

async function lookup(symbol) {
  try {
    return await this.iex.symbol(symbol).price();
  } catch (err) {
      console.log(err)
    throw new Error("Invalid symbol");
  }
}

async function getCompanyName(iex, symbol) {
    try {
        const info = await iex.symbol(symbol).company()
      return info.companyName;
    } catch (err) {
        console.log(err)    
      throw new Error("Invalid symbol" + symbol);
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

module.exports = { buy, lookup, history };
