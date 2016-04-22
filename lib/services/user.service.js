import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;
import md5 from "md5";

import {User, UserDAO} from "../models/user.model";
import {UserRedisUtil} from "../models/user.redis.util";
import {Event, EventDAO} from "../models/event.model";
import {ConstantUtil} from "../common/constant.util";
import {ChineseStringUtil} from "../common/chinese.string";

export class UserService {
  static getInstance() {
    return UserService._instance;
  }

  constructor(log) {
  	this._log = log;
  	UserService._instance = this;
  	this._log.info("user service inited");
  }

  ////////////////////////////////////
  // User
  ////////////////////////////////////

  * login(account, password) {
  	var user = yield UserDAO.getByAccount(account);
  	if (!user) {
  	  throw { status: 501, message: "account not exist"};
  	}
  	var md5password = md5(password);
  	if (md5password == user.password) {
  	   var token = md5(user._id + " " + new Date().getTime() + Math.random());
  	   user.password = "";
  	   yield UserRedisUtil.addUser(user, token);
  	   user.token = token;
       return user;
  	} else {
  	  throw { status: 501, message: "password error"};
  	}
  }

  * register(account, password, name, avatar) {
    var existUser = yield UserDAO.getByAccount(account);
    if (existUser) {
      throw { status: 501, message: "account exists!"};
    }
    password = md5(password);
    var user = new User(null, name, account, password, avatar);
    var result = yield UserDAO.insert(user);
    user._id = result;
    delete user.password;

    //TODO init user queue in chat util
    return user;
  }

  * getById(currUser, id) {
    var user = yield UserDAO.get(id);
    return user;
  }

  * updateProperty(currUser, password, name, avatar) {
    var update = {};
    update.password = md5(password);
    update.nickName = nickName;
    update.avatar = avatar;
    var result = yield UserDAO.updateProperty(currUser._id, update);
    if (result == true)
      return true;
    return result;
  }

  * del(id) {
    var result = yield UserDAO.del(id);
    if (result == true)
      return true;
    return result;
  }

  * getList(currUser) {
    var users = yield UserDAO.getList();
    return [for (user of users) User.toClient(user)];
  }

  * getUserByToken(token) {
    var user = yield UserRedisUtil.getUserByToken(token);
    return user;
  }

  * updateUserExpireTime(token) {
    return yield UserRedisUtil.updateTokenExpireTime(token);
  }

  * searchUser(currUser, name, skip, limit) {
    var users = yield UserDAO.searchByName(name, skip, limit);
    return [for (user of users) User.toClient(user)];
  }

  * userOffline(currUser) {
    var result = yield UserRedisUtil.userOffline(currUser._id);
    this._log.info("user offline from user.service, userId is " + userId + ", result is " + result);
  }

  ////////////////////////////////////
  // Friend
  ////////////////////////////////////

  * addFriend(currUser, userId) {
    //var result = yield UserRedisUtil.addFriend(currUser._id, userId);
    //return result;

    // add to event list, instead of adding as friend
    var message = ChineseStringUtil.getEventMessage() + currUser.name;
    var event = new Event(null, ConstantUtil.Event_Type_Friend_Request, message, currUser._id, userId);
    var result = yield EventDAO.insert(event);
    return true;
  }

  * approveFriend(currUser, eventId) {
    var event = yield EventDAO.get(eventId);
    yield UserRedisUtil.addFriend(currUser._id, event.fromId);
    yield UserRedisUtil.addFriend(event.fromId, currUser._id);
    var result = yield EventDAO.setHandled(eventId);
    return result;
  }

  * getFriends(currUser) {
    var ids = yield UserRedisUtil.getFriends(currUser._id);
    var userids = new Array();
    if (!ids)
      return [];
    for (var id of ids) {
      userids.push(ObjectID(id));
    }
    var users = yield UserDAO.getByIds(userids);
    return [for (user of users) User.toClient(user)];
  }

  * removeFriend(currUser, userId) {
    var result = yield UserRedisUtil.removeFriend(currUser._id, userId);
    result = yield UserRedisUtil.removeFriend(userId, currUser._id);
    return result;
  }
}
