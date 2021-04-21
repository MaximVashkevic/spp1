const { Router } = require("express");
const render = require('../helpers/renderHelper')

const router = new Router();

router.get("/", (req, res) => {
    // TODO: get acc info
    render(req, res, "main", "home", true, 
    {accountInfo: {
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
  render(req, res, "history", "History", true, {accountInfo: {
      total: 100,
      transactions: [
        {
          symbol: "asd",
          name: "Apple",
          shares: 12,
          price: "123",
          total: "1234",
          time: Date.now().toLocaleString(),
        },
      ],
    },
  });
});

module.exports = router;
