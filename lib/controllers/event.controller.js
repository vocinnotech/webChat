export function EventController(eventService) {
	return {
		* getList(next) {
			var currUser = this.request.user;
			this.body = yield eventService.getList(currUser);
			this.type = "json";
			this.status = 200;
			yield next;
		}
	};
}
