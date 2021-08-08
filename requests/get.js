var path = require('path');
var common = require('../common');

module.exports = async function getMethod(requestProps) {
  var publicPath = path.join('websites/public', decodeURI(requestProps.url.pathname.endsWith('/') || !requestProps.url.pathname ? requestProps.url.pathname + 'index.html' : requestProps.url.pathname));
  
  if (!common.isSubDir('websites/public', publicPath)) {
    await common.resp.s404(requestProps);
    return;
  }
  
  let match;
  
  if (requestProps.url.pathname.startsWith('/api/')) {
    await common.resp.headers(requestProps, 500, { 'content-type': 'text/plain; charset=utf-8' });
    await common.resp.end(requestProps, 'Error: invalid API endpoint');
  }
  
  else {
    await common.resp.fileFull(requestProps, publicPath);
  }
};
