export function UserController(userService) {
  return {
  	* login(next) {
  	  var account = this.query.account;
  	  var password = this.query.password;
  	  this.body = yield userService.login(account, password);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* register(next) {
  	  var account = this.request.body.account;
  	  var password = this.request.body.password;
  	  var name = this.request.body.name;
  	  var avatar = this.request.body.avatar;
  	  this.body = yield userService.register(account, password, name, avatar);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* search(next) {
  	  var currUser = this.request.user;
  	  var name = this.query.name;
  	  var skip = parseInt(this.query.skip);
  	  var limit = parseInt(this.query.limit);
  	  this.body = yield userService.searchUser(currUser, name, skip, limit);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* update(next) {
  	  var currUser = this.request.user;
  	  var password = this.request.body.password;
  	  var name = this.request.body.name;
  	  this.body = yield userService.updateProperty(currUser, password, name, avatar);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* getList(next) {
  	  var currUser = this.request.user;
  	  this.body = yield userService.getList(currUser);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* addFriend(next) {
  	  var user = this.request.user;
  	  var id = this.request.body.id;
  	  this.body = yield userService.addFriend(user, id);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

    * approveFriend(next) {
      var user = this.request.user;
      var id = this.request.body.id;
      this.body = yield userService.approveFriend(user, id);
      this.type = "json";
  	  this.status = 200;
  	  yield next;
    },

  	* getFriends(next) {
  	  var user = this.request.user;
  	  this.body = yield userService.getFriends(user);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	},

  	* delFriend(next) {
  	  var user = this.request.user;
  	  var id = this.request.body.id;
  	  this.body = yield userService.removeFriend(user, id);
  	  this.type = "json";
  	  this.status = 200;
  	  yield next;
  	}
  };
}
