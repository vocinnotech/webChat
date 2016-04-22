import router from "koa-router";

import {EventService} from "../services/event.service.js";
import {EventController} from "../controllers/event.controller.js";

export function EventRouter(log) {
	var service = new EventService(log);
	var controller = new EventController(service);
	var r = new router();
	r.get("/session/events", controller.getList);
	log.info("event router inited");
	return r;
}
