'use strict';
import cofy from "cofy";
import mongodb from "cofy-mongodb";
var MongoClient = mongodb.MongoClient;
import mount from "koa-mount";
import co from "co";
// import ioredis from "ioredis";
import rabbit from "rabbit.js";
import Redis from "cofy-ioredis";

import {UserDAO} from "./models/user.model.js";
import {EventDAO} from "./models/event.model.js";
import {UserRedisUtil} from "./models/user.redis.util.js";

import {UserRouter} from "./routers/user.router.js";
import {EventRouter} from "./routers/event.router.js";

import {ConstantUtil} from "./common/constant.util.js";

export class Bootstrapper {
  constructor(app, mongoUrl, rabbitUrl, redisUrl, io, log, next) {
  	this._app = app;
  	this._mongoUrl = mongoUrl;
	  this._rabbitUrl = rabbitUrl;
	  this._redisUrl = redisUrl;
	  this._io = io;
	  this._log = log;
	  this._next = next;

  	co(function *() {
  	  try {
  	    this._checkEnv();
        yield this._initDb(mongoUrl, redisUrl, rabbitUrl);
  	    yield this._initDAO();
  	    yield this._initRouter(this._app);
  	    yield this._initUtil();

  	    this._next();
  	  } catch (err) {
  	    this._log.error(err.stack);
  	    this._log.error("error when inited bootstrapper, err is " + err);
  	  }

  	}.bind(this));
  }

  _checkEnv() {
  	if (!process.env.VIRTUAL_HOST) this._log.error("VIRTUAL_HOST is null!!!");
  	if (!process.env.MONGO_URL) this._log.error("MONGO_URL is null!!!");
  	if (!process.env.SERVER_TOKEN) this._log.error("SERVER_TOKEN is null!!!");
  	if (!process.env.RABBIT_URL) this._log.error("RABBIT_URL is null!!!");
  	if (!process.env.REDIS_URL) this._log.error("REDIS_URL is null!!!");

  	this._log.info("rabbit url is " + process.env.RABBIT_URL);
  	this._log.info("redis url is " + process.env.REDIS_URL);
  	this._log.info("mongo url is " + process.env.MONGO_URL);
  }

  * _initDb(mongoUrl, redisUrl, rabbitUrl) {
    this._mongo = yield MongoClient.$connect(mongoUrl);
    this._redis = new Redis(redisUrl);
    this._rabbitContext = null;
  }

  * _initDAO() {
    yield EventDAO.init(this._mongo, this._log);
    yield UserDAO.init(this._mongo, this._log);
    yield UserRedisUtil.init(this._redis);
  }

  * _initRouter(app) {
    var userRouter = UserRouter(this._redis, this._log);
    var eventRouter = EventRouter(this._log);
    app.use(mount("/", userRouter.middleware()));
    app.use(mount("/", eventRouter.middleware()));
  }

  * _initUtil() {
    ConstantUtil.init();
  }
}
