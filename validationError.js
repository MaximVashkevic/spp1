function ValidationError(messages) {
    this.name = 'ValidationError';
    this.message = 'Parameters are invalid';
    this.stack = (new Error()).stack;
    this.messages = messages
  }

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

module.exports = ValidationError;