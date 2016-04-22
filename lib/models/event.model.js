import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export class Event {
  constructor(id, type, message, fromId, toId) {
    if (id)
      this._id = String(id);
    this.type = parseInt(type);
    this.message = message;
    this.fromId = String(fromId);
    this.toId = String(toId);
    this.handled = false;
  }

  static fromMongo(doc) {
  	var event = new Event(doc._id, doc.type, doc.message, doc.fromId, doc.toId);
    event.handled = false;
  	return event;
  }

  static toMongo(data) {
  	var event = {};
    event.type = data.type;
    event.message = data.message;
    event.fromId = ObjectID(data.fromId);
    event.toId = ObjectID(data.toId);
    event.handled = data.handled;
    event.lastModified = new Date().getTime();
    return event;
  }

  static toClient(data) {
  	var event = {};
  	event._id = data._id;
    event.type = data.type;
    event.message = data.message;
    event.fromId = data.fromId;
    event.toId = data.toId;
    event.handled = data.handled;
    event.lastModified = data.lastModified;
    event.createDate = ObjectID(String(data._id)).getTimestamp().getTime();
    return event;
  }
}

export class EventDAO {
  static _events;
  static _log;

  static * init(mongo, log) {
  	this._log = log;
  	if (!this._events) {
  	  this._events = mongo.collection("events");
  	  yield this._events.$ensureIndex({'fromid': 1, 'toId': 1});
  	  this._log.info("event index ensured");
  	}
  }

  static * insert(event) {
  	var result = yield this._events.$insert(Event.toMongo(event));
  	return result[0]._id;
  }

  static * get(id) {
    var doc = yield this._events.$findOne({'_id': ObjectID(String(id))});
    if (!doc) return null;
    return Event.fromMongo(doc);
  }

  static * setHandled(id) {
    var result = yield this._events.$update({'_id': ObjectID(String(id))}, {$set: {'handled': true}});
    return true;
  }

  static * getByToId(toId) {
    var sort = {};
	  sort._id = -1;

    var docs = yield this._events.find({'toId': ObjectID(String(toId)), 'handled': false}, {sort: sort}).$toArray();
    if (!docs) return [];
    return [for (doc of docs) Event.fromMongo(doc)];
  }
}
