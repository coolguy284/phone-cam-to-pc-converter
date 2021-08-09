var fs = require('fs');

// load environment variables from .env file
try {
  fs.readFileSync('.env').toString().split(/\r?\n/g).forEach(entry => {
    if (entry[0] == '#') return;
    let split = entry.split(':');
    if (split.length < 2) return;
    let key = split[0].trim();
    let value = split.slice(1).join(':').trim();
    process.env[key] = value;
  });
} catch (e) {
  console.error('Error parsing .env');
  console.error(e);
}

global.logger = require('./logutils.js')('main');

logger.info('Starting phone-cam-to-pc-converter');

var net = require('net');
var tls = require('tls');
var http = require('http');
var https = require('https');
var http2 = require('http2');
var crypto = require('crypto');
var ws = require('ws');

var common = require('./common');


// servers
global.currentRequestID = 0;

if (process.env.HTTP_IP) {
  global.tcpServer = net.createServer(conn => {
    if (process.env.LOG_DEBUG == 'true') {
      logger.debug(`TCP open ${common.mergeIPPort(conn.remoteAddress, conn.remotePort)}`);
      conn.on('close', hadError => logger.debug(`TCP close ${common.mergeIPPort(conn.remoteAddress, conn.remotePort)} ${hadError ? 'error' : 'normal'}`));
    }
    
    conn.setNoDelay(true);
    
    httpServer.emit('connection', conn);
  });
  
  
  tcpServer.listen({ host: process.env.HTTP_IP, port: process.env.HTTP_PORT }, () => {
    logger.info(`HTTP server listening on ${common.mergeIPPort(process.env.HTTP_IP, process.env.HTTP_PORT)}`);
  });
  
  global.httpServer = http.createServer(require('./requests/main'));
  httpServer.on('upgrade', require('./requests/upgrade'));
}

if (process.env.HTTPS_IP) {
  global.tlsServer = tls.createServer({
    secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1,
    //ciphers: crypto.constants.defaultCoreCipherList + ':!TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256:!TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384:!TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:!TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA:!TLS_RSA_WITH_AES_256_GCM_SHA384:!TLS_RSA_WITH_AES_256_CCM_8:!TLS_RSA_WITH_AES_256_CCM:!TLS_RSA_WITH_ARIA_256_GCM_SHA384:!TLS_RSA_WITH_AES_128_GCM_SHA256:!TLS_RSA_WITH_AES_128_CCM_8:!TLS_RSA_WITH_AES_128_CCM:!TLS_RSA_WITH_ARIA_128_GCM_SHA256:!TLS_RSA_WITH_AES_256_CBC_SHA256:!TLS_RSA_WITH_AES_128_CBC_SHA256:!TLS_RSA_WITH_AES_256_CBC_SHA:!TLS_RSA_WITH_AES_128_CBC_SHA:@STRENGTH',
    ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_RSA_WITH_ARIA_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_ARIA_128_GCM_SHA256:@STRENGTH',
    key: fs.readFileSync(process.env.TLS_KEY_FILE),
    cert: fs.readFileSync(process.env.TLS_CERT_FILE),
    
    ALPNProtocols: ['h2', 'http/1.1'],
  }, conn => {
    if (process.env.LOG_DEBUG == 'true') {
      logger.debug(`TLS open ${common.mergeIPPort(conn.remoteAddress, conn.remotePort)} ${conn.servername} ${conn.alpnProtocol} ${conn.authorized}`);
      conn.on('close', hadError => logger.debug(`TLS close ${common.mergeIPPort(conn.remoteAddress, conn.remotePort)} ${hadError ? 'error' : 'normal'}`));
    }
    
    conn.setNoDelay(true);
    
    if (conn.alpnProtocol == false || conn.alpnProtocol == 'http/1.1')
      httpsServer.emit('secureConnection', conn);
    else if (conn.alpnProtocol == 'h2')
      http2Server.emit('secureConnection', conn);
  });
  
  tlsServer.listen({ host: process.env.HTTPS_IP, port: process.env.HTTPS_PORT }, () => {
    logger.info(`HTTPS/H2 server listening on ${common.mergeIPPort(process.env.HTTPS_IP, process.env.HTTPS_PORT)}`);
  });
  
  global.httpsServer = https.createServer(require('./requests/main'));
  httpsServer.on('upgrade', require('./requests/upgrade'));
  
  global.http2Server = http2.createSecureServer({ settings: { enableConnectProtocol: true } });
  http2Server.on('stream', require('./requests/main'));
}

if (process.env.HTTP_IP || process.env.HTTPS_IP) {
  global.videoWSServer = new ws.Server({ noServer: true });
  videoWSServer.on('connection', function videoWSFunc(ws, req, requestProps) {
    ws.on('message', msg => {
      for (var ws2 of videoWSServer.clients) {
        if (ws2 != ws) ws2.send(msg);
      }
    });
  });
}


// so server doesnt go down for an error
process.on('uncaughtException', err => {
  logger.error('UncaughtException');
  logger.error(err);
});

process.on('unhandledRejection', err => {
  logger.error('UnhandledRejection');
  logger.error(err);
});


// website cache
if (process.env.CACHE_MODE == '1') {
  global.filesCache = {};
  require('./common/recursivereaddir')('websites/public').forEach(filename => {
    filename = 'websites/public/' + filename;
    global.filesCache[filename] = {
      stats: { mtime: fs.statSync(filename).mtime },
      file: fs.readFileSync(filename),
    };
  });
}


// simple repl for executing commands
require('repl').start({
  prompt: '',
  terminal: true,
  useColors: true,
  useGlobal: true,
  preview: false,
  breakEvalOnSigint: true,
});
