"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.categoryModel = {
    list: () => prisma_js_1.prisma.category.findMany({
        orderBy: { id: "asc" },
        select: { id: true, name: true, slug: true, description: true },
    }),
};
//# sourceMappingURL=category.model.js.map