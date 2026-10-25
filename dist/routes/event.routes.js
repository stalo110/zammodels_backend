"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRoutes = void 0;
const express_1 = require("express");
const event_controller_js_1 = require("../controllers/event.controller.js");
exports.eventRoutes = (0, express_1.Router)();
exports.eventRoutes.get("/", event_controller_js_1.listEvents);
//# sourceMappingURL=event.routes.js.map