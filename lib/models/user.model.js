import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export class User {
  constructor(id, name, account, password, avatar) {
  	if (id)
  	  this._id = String(id);
  	this.name = name;
  	this.account = account;
  	this.password = password;
  	this.avatr = avatar;
  }

  static fromMongo(doc) {
  	var user = new User(doc._id, doc.name, doc.account, doc.password, doc.avatar);
  	return user;
  }

  static toMongo(data) {
  	var user = {};
    user.name = data.name;
    user.account = data.account;
    user.password = data.password;
    user.avatar = data.avatar;
    user.lastModified = new Date().getTime();
    return user;
  }

  toMongo() {
    return User.toMongo(this);
  }

  static toClient(data) {
  	var user = {};
  	user._id = data._id;
    user.name = data.name;
    user.account = data.account;
    user.password = data.password;
    user.avatar = data.avatar;
    user.lastModified = data.lastModified;
    user.createDate = ObjectID(String(data._id)).getTimestamp().getTime();
    return user;
  }
}

export class UserDAO {
  static _users;
  static _log;

  static * init(mongo, log) {
  	this._log = log;
  	if (!this._users) {
  	  this._users = mongo.collection("users");
  	  yield this._users.$ensureIndex({'account': 1});
  	  this._log.info("user index ensured");
  	}
  }

  static * insert(user) {
  	var result = yield this._users.$insert(User.toMongo(user));
  	return result[0]._id;
  }

  static * get(id) {
  	var doc = yield this._users.$findOne({'_id': ObjectID(String(id))});
  	if (!doc) return null;
  	return User.fromMongo(doc);
  }

  static * getByAccount(account) {
  	var doc = yield this._users.$findOne({'account': account});
  	if (!doc) return null;
  	return User.fromMongo(doc);
  }

  static * getByIds(ids) {
  	var docs = yield this._users.find({'_id': {$in: ids}}).$toArray();
  	if (!docs) return [];
  	return [for (doc of docs) User.fromMongo(doc)];
  }

  static * searchByName(name, skip, limit) {
  	var sort = {};
  	sort._id = -1;

  	var pattern = new RegExp("^.*" + name + ".*$");
  	var query = { name: pattern };
    var docs;
  	if (isNaN(limit) || isNaN(skip) || skip == null || skip == undefined || limit == null || limit == undefined) {
  	  docs = yield this._users.find(query, {sort: sort}).$toArray();
  	} else {
  	  docs = yield this._users.find(query, {sort: sort}).skip(skip).limit(limit).$toArray();
  	}
  	if (!docs) return [];
  	return [for (doc of docs) User.fromMongo(doc)];
  }

  static * updateProperty(id, property) {
  	var update = {};
  	if (property.name) update.name = property.name;
  	if (property.password) update.password = property.password;
  	if (property.avatar) update.avatar = property.avatar;
  	update.lastModified = new Date().getTime();
  	var result = yield this._users.$update({'_id': ObjectID(String(id))}, {$set: update});
  	if (result && result[1].ok) return true;
  	return result;
  }

  static * del(id) {
  	var result = yield this._users.$remove({'_id': ObjectID(String(id))});
  	if (result && result[1].ok) return true;
  	return result;
  }

  static * getList(skip, limit) {
  	var sort = {};
    sort._id = -1;

    var docs;
  	if (isNaN(limit) || isNaN(skip) || skip == null || skip == undefined || limit == null || limit == undefined) {
  	  docs = yield this._users.find({}, {sort: sort}).$toArray();
  	} else {
  	  docs = yield this._users.find({}, {sort: sort}).skip(skip).limit(limit).$toArray();
  	}
  	if (!docs) return [];
  	return [for (doc of docs) User.fromMongo(doc)];
  }

  static * getCount() {
  	return yield this._storys.find({}).$count();
  }
}
