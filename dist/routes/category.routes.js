"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
const category_controller_js_1 = require("../controllers/category.controller.js");
exports.categoryRoutes = (0, express_1.Router)();
exports.categoryRoutes.get("/", category_controller_js_1.listCategories);
//# sourceMappingURL=category.routes.js.map