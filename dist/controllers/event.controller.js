"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
const event_model_js_1 = require("../models/event.model.js");
async function listEvents(_request, response, next) {
    try {
        response.json({ data: await event_model_js_1.eventModel.list() });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=event.controller.js.map