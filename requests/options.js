var path = require('path');
var common = require('../common');

module.exports = async function optionsMethod(requestProps) {
  var publicPath = path.join('websites/public', decodeURI(requestProps.url.pathname.endsWith('/') || !requestProps.url.pathname ? requestProps.url.pathname + 'index.html' : requestProps.url.pathname));
  
  if (!common.isSubDir('websites/public', publicPath)) {
    await common.resp.headers(requestProps, 204, { 'allow': 'options, get, head' });
    await common.resp.end(requestProps);
    return;
  }
  
  if (requestProps.url.pathname.startsWith('/api/')) {
    await common.resp.headers(requestProps, 204, { 'allow': 'options, get' });
    await common.resp.end(requestProps);
  }
  
  else {
    await common.resp.headers(requestProps, 204, { 'allow': 'options, get, head' });
    await common.resp.end(requestProps);
  }
};
