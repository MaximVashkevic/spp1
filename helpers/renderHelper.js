const {clearMessages} = require('./popupMessageHelper')

function render(req, res, view, title, isAuthorized, extraParams) {
  res.render(view, {
    title,
    isAuthorized,
    messages: req.session.messages,
    ...extraParams,
  });
  clearMessages(req);
}

module.exports = render;
