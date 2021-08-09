var common = require('../common');

module.exports = async function connectMethod(requestProps) {
  // this is exclusively for http2
  if (requestProps.httpVersion == 1) return 1;
  
  if (requestProps.headers[':protocol'] == 'websocket') {
    if (requestProps.url.pathname == '/video_ws') {
      common.resp.ws(videoWSServer, requestProps);
    } else {
      await common.resp.s404(requestProps);
    }
  } else {
    await common.resp.s404(requestProps);
  }
};
