'use strict';

module.exports = function RequestError(response) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = this.statusCode = response.statusMessage; // alias it
  this.statusCode = response.statusCode;
};

require('util').inherits(module.exports, Error);
