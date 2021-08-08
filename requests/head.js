var path = require('path');
var common = require('../common');

module.exports = async function headMethod(requestProps) {
  var publicPath = path.join('websites/public', decodeURI(requestProps.url.pathname.endsWith('/') || !requestProps.url.pathname ? requestProps.url.pathname + 'index.html' : requestProps.url.pathname));
  
  if (!common.isSubDir('websites/public', publicPath)) {
    await common.resp.s404(requestProps, true);
    return;
  }
  
  if (requestProps.url.pathname.startsWith('/api/')) {
    await common.resp.headers(requestProps, 501);
    await common.resp.end(requestProps);
  }
  
  await common.resp.fileFull(requestProps, publicPath, true);
};
