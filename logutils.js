var util = require('util');
var winston = require('winston');

module.exports = function createLoggerWrapper(name) {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(info => `[${new Date().toISOString()}] [${name}] ${info.level}: ${info instanceof Error ? util.inspect(info) : typeof info.message == 'string' ? info.message : util.inspect(info.message)}`)
    ),
    transports: [new winston.transports.Console({ level: process.env.LOG_DEBUG == 'true' ? 'debug' : 'info' })]
  });
};
