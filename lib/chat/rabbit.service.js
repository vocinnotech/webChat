import amqp from "amqplib/callback_api";
import {Payload} from "./payload";

const Exchange_Name_Event = "exchange.event";
const Exchange_Name_UserMessage = "exchange.user";
const Queue_Name_Event = "queue.event";

export default class RabbitService {
  static init(rabbitUrl, log, connectionPool) {
    this._rabbitUrl = rabbitUrl;
    this._rabbitClients = new Map();
    this._rabbitClients.set("user", new Map());
    this._log = log;

    RabbitService._userConnectionPool = [];
    ConnectionPool.init(rabbitUrl, log, connectionpoolCount, () => {
      this._initAddEventListenerForSystemEvent();
      this._log.info("rabbit service inited");
    });
  }

  static sendSystemEvent(message) {
    if (this._rabbitClients.has("system")) {
      this._rabbitClients.get("system").publish(Exchange_Name_Event, '', new Buffer(message));
    } else {
      this._log.error("system is offline!!!");
    }
  }

  static sendUserMessage(toId, payload) {
    var systemChannel = this._rabbitClients.get("system");
    var message = JSON.stringify(payload);
    systemChannel.sendToQueue("user:" + toId, new Buffer(message), {persistend: true});
  }

  static initUserQueue(userId) {
    var connection = ConnectionPool.getConnectionForChannel();
    var exchangeOption = {durable: false};
    connection.createChannel((err, channel) => {
      if (err !== null) return this._bail("create channel callback, user id " + userId, err, connection);
      channel.assertExchange(Exchange_Name_UserMessage, 'direct', exchangeOption);
      channel.assertQueue("user:" + userId, {exclusive: false, durable: true, autoDelete: false}, (err, ok) => {
        if (err !== null) return this._bail("assert queue callback, user id is " + userId, err, connection);
        var queue = ok.queue;
        channel.bindQueue(queue, Exchange_Name_UserMessage, "user:" + userId, {});
        channel.close();
        this._log.info("finish init exchange for " + userId);
      });
    });
  }

  static removeEventListenerForUser(userId, next) {
    var users = this._rabbitClients.get("user");
    if (users.has(userId)) {
      var channel = users.get(userId);
      if (channel.isClosing) return;
      channel.isClosing = true;
      users.delete(userId);
      channel.close(() => {
        channel.isClosing = false;
        channel = null;
        console.log("user " + userId + " close channel");
        if (next) return next();
      });
    }
  }

  static initAddEventListenerForUserMessage(userId, afterAdded, next) {
    var exchangeOption = {durable: false};
    var connection = ConnectionPool.getConnectionForChannel();
    connection.createChannel((err, channel) => {
      if (err !== null) return RabbitService._bail("create channel callback, user id " + userId, err, connection);
      channel.assertExchange(Exchange_Name_UserMessage, 'direct', exchangeOption);
      channel.assertQueue("user:" + userId, {exclusive: false, durable: true, autoDelete: false}, (err, ok) => {
        if (err !== null) return RabbitService._bail("assert queue callback, user id " + userId, err, connection);
        var queue = ok.queue;
        channel.bindQueue(queue, Exchange_Name_UserMessage, "user:" + userId, {});
        channel.consume(queue, (msg) => {
          if (msg) {
            var data = JSON.parse(msg.content.toString());
            var pyaload = Payload.fromJSON(data);
            if (next) return next(pyaload);
          }
        }, {noAck: true}, (err, ok) => {
          if (err !== null) return RabbitService._bail("comsume setup callback, user id " + userId, err, connection);
          if (afterAdded) return afterAdded();
        });
        if (RabbitService._rabbitClients.get("user").has(userId)) {
          RabbitService.closeUserChannel(userId, ()=> {
            RabbitService._rabbitClients.get("user").set(userId, channel);
          });
        } else {
          RabbitService._rabbitClients.get("user").set(userId, channel);
        }
      });
    });
  }

  static _bail(info, err, conn) {
    this._log.error("error from rabbit, info is " + info + ", error message is " + err);
  }

  static _initAddEventListenerForSystemEvent() {
    var exchangeOption = {durable: false};
    var connection = ConnectionPool.getConnectionForChannel();
    connection.createChannel((err, channel) => {
      if (err !== null) return this._bail("create channel callback", err, connection);
      channel.assertExchange(Exchange_Name_Event, 'fanout', exchangeOption, (err) => {
        if (err !== null) return this._bail("assert exchange callback", err, connection);
        channel.assertQueue(Queue_Name_Event + Math.random(), {exclusive: false, autoDelete: true}, (err, ok) => {
          if (err !== null) return this._bail("assert queue callback", err, connection);
          var queue = ok.queue;
          channel.bindQueue(queue, Exchange_Name_Event, '');
          channel.consume(queue, (msg) => {
            if (msg) {
              var data = JSON.parse(msg.content.toString());
              var pyaload = Payload.fromJSON(data);
              return ChatchannelUtil.receiveSystemMessage(pyaload);
            }
          }, {noAck: true}, (err, ok) => {
            if (err !== null) return this._bail("comsume setup callback", err, connection);
          });
          this._rabbitClients.set("system", channel);
        });
      });
    });
  }
}

export class ConnectionPool{
  static init(rabbitUrl, log, connectionMax, next) {
    this._log = log;
    this._pool = [];
    var initedCount = 0;
    for (var i = 0; i < connectionMax; i ++) {
      amqp.connect(rabbitUrl, (err, connection) => {
        if (err !== null) return this._bail(err, connection);
        this._pool.push(connection);
        initedCount ++;
        if (initedCount == connectionMax) {
          this._log.info("rabbit connection pool inited");
          return next();
        }
      });
    }
    this._indexCount = 0;
  }

  static _bail(err, conn) {
    if (conn) {
      conn.close(() => {
        this._log.error("error from rabbit, and close conn now, error message is " + err);
      });
    } else {
      this._log.error("error from rabbit, error message is " + err);
    }
  }

  static getConnection() {
    if (this._pool.length == 1) return this._pool[0];
    var random = parseInt(Math.random() * this._pool.length);
    return this._pool[random];
  }
}
