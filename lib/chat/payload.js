import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export class Payload {

  // if type is 1, it means "single", single chat
  // if type is 2, it means "room", room chat, 
  // if type is 3, it emans "customer service", 
  // if type is 4, it means "login", send login result to client
  // if type is 5, it means "logout", disconnect reabbit exchang and queue
  // if type is 6, it means "customer service start"

  // if single
  // 		attributes
  //			toId
  //

  static Payload_Type_Single_Chat;
  static Payload_Type_Room_Chat;
  static Payload_Type_CustomerService_Chat;
  static Payload_Type_Login;
  static Payload_Type_Loginout;
  static Payload_Type_CustomerService_Chat_Start;
  static Payload_Type_Offline;

  static Message_Type_Text;
  static Message_Type_Voice;
  static Message_Type_Image;

  static init() {
    this.Payload_Type_Single_Chat = 1;
    this.Payload_Type_Room_Chat = 2;
    this.Payload_Type_CustomerService_Chat = 3;
    this.Payload_Type_Login = 4;
    this.Payload_Type_Loginout = 5;
    this.Payload_Type_CustomerService_Chat_Start = 6;
    this.Payload_Type_Offline = 7;

    this.Message_Type_Text = 1;
    this.Message_Type_Voice = 2;
    this.Message_Type_Image = 3;
  }

  static validate(payload) {
    console.log(typeof payload);
    if (! payload.type) return false;
    if (! payload.message) return false;
    if (! payload.fromId) return false;
    return true;
  }

  constructor(toId, fromId, type, message, attributes, contentType, roomId) {
    this.type = type;
    this.message = message;
    this.attributes = attributes;
    this.roomId = roomId;
    this.fromId = fromId;
    this.toId = toId;
    this.createDate = new Date().getTime();
    this.contentType = contentType;
    this.received = false;
    if (!this.contentType) this.contentType = Payload.Message_Type_Text;
  }

  toMongo() {
    var payload = {};
    payload.type = this.type;
    payload.message = this.message;
    payload.fromId = this.fromId ? ObjectID(String(this.fromId)) : "";
    payload.toId = this.toId ? ObjectID(String(this.toId)) : "";
    payload.roomId = this.roomId ? ObjectID(String(this.roomId)) : "";
    payload.attributes = this.attributes;
    payload.createDate = this.createDate;
    payload.contentType = this.contentType;
    payload.received = this.received ? true:false;
    return payload;
  }

  static toMongo(source) {
    var payload = {};
    payload.type = source.type;
    payload.message = source.message;
    payload.fromId = source.fromId ? ObjectID(String(source.fromId)) : "";
    payload.toId = source.toId ? ObjectID(String(source.toId)) : "";
    payload.roomId = source.roomId ? ObjectID(String(source.roomId)) : "";
    payload.attributes = source.attributes;
    payload.createDate = source.createDate;
    payload.contentType = source.contentType;
    payload.received = source.received ? true:false;
    return payload;
  }

  toAdmin() {
    var payload = {};
    payload._id = this._id;
    payload.type = this.type;
    payload.message = this.message;
    payload.fromId = this.fromId ? String(this.fromId) : "";
    payload.toId = this.toId ? String(this.toId) : "";
    payload.roomId = this.roomId ? String(this.roomId) : "";
    payload.attributes = this.attributes;
    payload.createDate = this.createDate;
    payload.received = this.received;
    payload.contentType = this.contentType;
    return payload;
  }

  toClient() {
    var payload = {};
    payload._id = this._id;
    payload.type = this.type;
    payload.message = this.message;
    payload.fromId = this.fromId ? String(this.fromId) : "";
    payload.toId = this.toId ? String(this.toId) : "";
    payload.roomId = this.roomId ? String(this.roomId) : "";
    payload.attributes = this.attributes;
    payload.createDate = this.createDate;
    payload.received = this.received;
    payload.contentType = this.contentType;
    return payload;
  }

  static fromJSON(doc) {
    var payload = new Payload(doc.toId, doc.fromId, doc.type, doc.message, doc.attributes, doc.contentType, doc.roomId);
    payload.createDate = doc.createDate;
    if (doc._id) payload._id = String(doc._id);
    payload.received = doc.received;
    return payload;
  }

  static fromMongo(doc) {
    var payload = new Payload(doc.toId, doc.fromId, doc.type, doc.message, doc.attributes, doc.contentType, doc.roomId);
    payload.createDate = doc.createDate;
    payload._id = doc._id;
    payload.received = doc.received;
    return payload;
  }

  static format(payload) {
    var data = {};
    if (payload._id) data._id = String(payload._id);
    data.type = payload.type;
    data.received = payload.received;
    data.message = String(payload.message);
    if (payload.attributes)
      data.attributes = payload.attributes;
    else
      data.attributes = {};
    data.fromId = payload.fromId ? payload.fromId : "";
    data.toId = payload.toId ? payload.toId : "";
    data.createDate = payload.createDate;
    data.contentType = payload.contentType ? payload.contentType : Payload.Message_Type_Text;
    data.roomId = payload.roomId ? payload.roomId : "";
    var dataString = JSON.stringify(data);
    return dataString;
  }
}