
const authorizationRule = require("../authorizedRoutes");
const {addMessage, messageTypes} = require("../helpers/popupMessageHelper")

module.exports = (req, res, next) => {
    if (
       authorizationRule(req.path) && !req.session.userID
    ) {
      addMessage(req, messageTypes.INFO, "Please log in or register");
      res.redirect("/login");
    }
    else {
        next()
    }
  }