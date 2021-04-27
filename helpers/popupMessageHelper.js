module.exports = {
  clearMessages(req) {
    req.session.messages = [];
    req.session.save();
  },
  addMessage(req, type, text) {
    req.session.messages.push({ type, text });
  },
  messageTypes: {
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
    DANGER: 'danger'
  }
};
