"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
const category_model_js_1 = require("../models/category.model.js");
async function listCategories(_request, response, next) {
    try {
        response.json({ data: await category_model_js_1.categoryModel.list() });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=category.controller.js.map