var logger = require('../logutils.js')('requests/main');

var common = require('../common');

var methods = {
  options: require('./options'),
  get: require('./get'),
  head: require('./head'),
  connect: require('./connect'),
};

// args.length == 2 is req, res (http1.1), while args.length == 4 is stream, headers, flags, rawHeaders (http2)
module.exports = async function main(...args) {
  try {
    if (args.length == 4 && args[1][':scheme'] != 'https') {
      args[0].close();
      return;
    }
    
    var requestProps = common.getRequestProps(...args, 'main');
    
    logger.info(common.getReqLogStr(requestProps));
    
    if (process.env.ONLY_LOCAL_IPS && process.env.ONLY_LOCAL_IPS != 'false' && !/(?:::ffff:)?(?:192.168.[0-9]{1,3}.[0-9]{1,3}|127.0.0.1)|::1/.test(requestProps.ip)) {
      await common.resp.headers(requestProps, 403);
      await common.resp.end(requestProps);
      logger.warn('blocked');
      return;
    }
    
    if (!(requestProps.method in methods && methods[requestProps.method](requestProps) != 1)) {
      await common.resp.headers(requestProps, 501);
      await common.resp.end(requestProps);
    }
  } catch (err) {
    logger.error(err);
    try {
      await common.resp.s500(requestProps);
    } catch (err2) {
      logger.error(err2);
    }
  }
};
