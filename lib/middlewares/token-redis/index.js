import Redis from "cofy-ioredis";

export default function(redisUrl) {
  return function *token(next) {
  	if (this.request.method == 'OPTIONS')
  	  return yield next;
  	var token = this.request.body.token;
  	if (!token && (this.request.method == 'GET' || this.request.method == 'DELETE')) 
  	  token = this.query.token;
  	if (!token) {
  	  this.status = 504;
  	  this.body = "make sure we have token";
  	} else {
      var redis = RedisClient.init(redisUrl);
      var tokenKey = "usertoken:" + token;
      var value = yield redis.$get(tokenKey);
      if (value) {
      	var user = JSON.parse(value);
      	yield redis.$pexpire(tokenKey, 7200000);
      	this.request.user = user;
      	yield next;
      } else {
      	this.status = 504;
      	this.body = "token expired";
      }
  	}
  }
}

export class RedisClient {
  static redis;
  static init(redisUrl) {
    if (!this.redis) {
      this.redis = new Redis(redisUrl);
      console.log("redis in token inited");
    }
    return this.redis;
  }
}