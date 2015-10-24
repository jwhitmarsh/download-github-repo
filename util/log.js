var winston = require('winston');
var log;

// setup logging
if (process.env.NODE_ENV !== 'test') {
  log = new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        prettyPrint: true,
        showLevel: false
      }),
      new winston.transports.File({
        filename: 'dgr.log'
      })
    ]
  });
} else {
  // while testing, log only to file, leaving stdout free for unit test status messages
  log = new winston.Logger({
    transports: [
      new winston.transports.File({
        filename: 'dgr.log'
      })
    ]
  });
}

module.exports = log;
