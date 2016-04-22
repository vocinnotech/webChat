import {Event, EventDAO} from "../models/event.model.js";

export class EventService {
	constructor(log) {
		this._log = log;
	}

	* getList(currUser) {
		var events = yield EventDAO.getByToId(currUser._id);
		return [for (event of events) Event.toClient(event)];
	}
}
