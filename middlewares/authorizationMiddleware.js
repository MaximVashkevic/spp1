
const authorizationRule = require("../authorizedRoutes");
const {addMessage} = require("../helpers/popupMessageHelper")

module.exports = (req, res, next) => {
    if (
       authorizationRule(req.path) && !req.session.userID
    ) {
      addMessage(req, "info", "Please log in or register");
      res.redirect("/login");
    }
    else {
        next()
    }
  }