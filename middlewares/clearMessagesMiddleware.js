module.exports = (req, res, next) => {
  if (!req.session.messages) {
    req.session.messages = [];
  }

  next();
};
