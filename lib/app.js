import http from 'http';
import socketio from "socket.io";
import koa from "koa";
import bunyan from "bunyan";
import co from "co";
import mount from "koa-mount";
import bodyParser from "koa-bodyparser";
import serve from 'koa-static';
import cors from "koa-cors";
import path from "path";
import net from 'net';

import {Bootstrapper} from "./bootstrapper.js";
import token from "./middlewares/token-redis";
import error from "./middlewares/error";

// var numCPUs = require('os').cpus().length;
// var sticky = require('socketio-sticky-session');
// var options = {
//   proxy: false, //activate layer 4 patching
//   header: 'x-forwarded-for', //provide here your header containing the users ip
//   num: numCPUs,
//   ignoreMissingHeader: true,
//   sync: {
//     isSynced: true, //activate synchronization
//     event: 'mySyncEventCall' //name of the event you're going to call
//   }
// };
// var server = sticky(options, function () {
//   var app = koa();
//   app.use(bodyParser());
//   var log = bunyan.createLogger({name: "im"});
//   app.use(error(app, "im"));
//   app.use(serve(path.join(__dirname + "/../", 'web')));
//   app.use(mount("/session", token(process.env.REDIS_URL)));
//   var ioopts = {
//     pingTimeout: 5,
//     pingInterval: 5
//   };
//   var server = http.createServer(app.callback(), ioopts);
//   var io = socketio(server);
//   new Bootstrapper(app, process.env.MONGO_URL, process.env.RABBIT_URL, process.env.REDIS_URL, io, log, function () {
//     app.use(cors());
//   }.bind(this));
//   return server;
// }.bind(this)).listen(5000, function () {
//   console.log('server started on 5000 port');
// });

var app = koa();
app.use(bodyParser());
var log = bunyan.createLogger({name: "im"});
app.use(error(app, "im"));
app.use(serve(path.join(__dirname + "/../", 'web')));
app.use(mount("/session", token(process.env.REDIS_URL)));
var ioopts = {
  pingTimeout: 5,
  pingInterval: 5
};
var server = http.createServer(app.callback(), ioopts);
var io = socketio(server);
new Bootstrapper(app, process.env.MONGO_URL, process.env.RABBIT_URL, process.env.REDIS_URL, io, log, function () {
  app.use(cors());
  server.listen(5000);
  log.info("app start, port 5000");
}.bind(this));
