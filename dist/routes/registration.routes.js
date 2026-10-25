"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRoutes = void 0;
const express_1 = require("express");
const registration_controller_js_1 = require("../controllers/registration.controller.js");
const upload_js_1 = require("../middleware/upload.js");
exports.registrationRoutes = (0, express_1.Router)();
exports.registrationRoutes.post("/", upload_js_1.auditionImageUpload.single("image"), registration_controller_js_1.createRegistration);
//# sourceMappingURL=registration.routes.js.map