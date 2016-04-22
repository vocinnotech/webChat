export class UserRedisUtil {
  static * init(redis) {
  	this._redis = redis;
  }

  ////////////////////////////////
  // User
  ////////////////////////////////

  static * addUser(user, token, isImLogin = false) {
  	var userjson = JSON.stringify(user);
  	var result = yield this._redis.$set(this._getUserTokenKey(token), userjson);

  	result = yield this._redis.$exists(this._getUserIdKey(user._id));
  	if(result) {
  	  var oldtoken = yield this._redis.$get(this._getUserIdKey(user._id));
      if (oldtoken != token) {
        var tokenexist = yield this._redis.$exists(this._getUserTokenKey(oldtoken));
        if (tokenexist) {
          yield this._redis.$del(this._getUserTokenKey(oldtoken));
        }
      }
  	}

    var id = user._id;
    yield this._redis.$set(this._getUserIdKey(id), token);
    yield this._redis.$pexpire(this._getUserTokenKey(token), 7200000);
    yield this._redis.$pexpire(this._getUserIdKey(id), 7200000);
    if (isImLogin) {
      yield this._userToOnlinelist(id);
    }
    return true;
  }

  static setUserByTokenAsync(token, user, next) {
  	var userjson = JSON.stringify(user);
  	this._redis.set(this._getUserTokenKey(token), userjson).then((result) => {
	  var id = user._id;
	  this._redis.set(this._getUserIdKey(id), token).then((result) => {

	  });
	  this._redis.pexpire(this._getUserTokenKey(token), 7200000).then((result) => {
	  });
	  this._redis.pexpire(this._getUserIdKey(id), 7200000).then((result) => {

	  });
	  this._userToOnlinelistAsync(id, (result) => {

	  });
	  return next(true);
    });
  }

  static * getUserByToken(token) {
  	var exist = yield this._redis.$exists(this._getUserTokenKey(token));
  	if (!exist)
  	  return null;

  	var result = yield this._redis.$get(this._getUserTokenKey(token));
  	if (!result)
  	  return null;

  	var user = JSON.parse(result);
  	return user;
  }

  static getUserByTokenAsync(token, next) {
    this._redis.exists(this._getUserTokenKey(token)).then((result) => {
  	  if (!result) return next(null);
  	  this._redis.get(this._getUserTokenKey(token)).then((result) => {
  	    if (!result) return next(null);
  		var user = JSON.parse(result);
  		return next(user);
  		});
  	});
  }

  static * updateTokenExpireTime(token, time) {
    if (!time)
  	time = 7200000;

    var user = yield this.getUserByToken(token);
  	var result = yield this._redis.$pexpire(this._getUserTokenKey(token), 7200000);
  	result = yield this._redis.$pexpire(this._getUserIdKey(user._id), 7200000);
  	return true;
  }

  static * userOffline(userId) {
  	var token = yield this._redis.$get(this._getUserIdKey(userId));
  	var result = yield this._redis.$del(this._getUserIdKey(userId));
  	result = yield this._redis.$del(this._getUserTokenKey(token));
  	yield this._userRemoveOnlinelist(userId);
  	return true;
  }

  static * _userToOnlinelist(userId) {
  	var result = yield this._redis.$rpush("users:online", userId);
  	return result == 1;
  }

  static _userToOnlinelistAsync(userId, next) {
  	this._redis.rpush("users:online", userId).then((result) => {
  	  return next(result == 1);
  	});
  }

  static * _userRemoveOnlinelist(userId) {
	  var result = yield this._redis.$lrem("users:online", userId)
  }

  static _getUserTokenKey(token) {
  	return "usertoken:" + token;
  }

  static _getUserIdKey(id) {
  	return "userid:" + String(id);
  }

  ////////////////////////////////
  // Friend
  ////////////////////////////////

  static * addFriend(currUserId, userId) {
  	var isFriend = yield UserRedisUtil.checkIsFriend(currUserId, userId);
  	if (isFriend) return true;
  	var result = yield this._redis.$sadd(this._getFriendKey(currUserId), String(userId));
  	if (result == 1) return true;
  	return false;
  }

  static * checkIsFriend(currUserId, userId) {
  	var result = yield this._redis.$sismember(this._getFriendKey(currUserId), String(userId));
  	return result == 1;
  }

  static * getFriends(currUserId) {
  	var result = yield this._redis.$smembers(this._getFriendKey(currUserId));
  	return result;
  }

  static * removeFriend(currUserId, userId) {
  	var isFriend = yield UserRedisUtil.checkIsFriend(currUserId, userId);
  	if (isFriend)
  	  return yield this._redis.$srem(this._getFriendKey(currUserId), String(userId));
  	return true;
  }

  static _getFriendKey(currUserId) {
	  return "friend:" + currUserId;
  }

  ////////////////////////////////
  // Block list
  ////////////////////////////////

  static * addBlock(currUserId, userId) {
    var result = yield this._redis.$sadd(this._getBlocklistKey(currUserId), userId);
  	if (result == 1)
  	  return true;
  	return false;
  }

  static * removeBlock(currUserId, userId) {
  	var result = yield this._redis.$srem(this._getBlocklistKey(currUserId), userId);
  	if (result == 1)
  	  return true;
  	return false;
  }

  static * checkIsBlock(currUserId, userId) {
  	var result = yield this._redis.$sismember(this._getBlocklistKey(currUserId), userId);
  	return result == 1;
  }

  static checkIsBlockAsync(currUserId, userId, next) {
  	this._redis.sismember(this._getBlocklistKey(currUserId), userId).then((result) => {
  	  return next(result == 1)
  	});
  }

  static * getBlocks(currUserId) {
  	var result = yield this._redis.$smembers(this._getBlocklistKey(currUserId));
  	return result;
  }

  static _getBlocklistKey(currUserId) {
	  return "block: " + currUserId;
  }
}
