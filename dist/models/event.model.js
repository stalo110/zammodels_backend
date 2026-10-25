"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.eventModel = {
    list: () => prisma_js_1.prisma.event.findMany({
        where: { status: { in: ["UPCOMING", "PAST"] } },
        orderBy: { eventDate: "asc" },
        include: { category: { select: { name: true, slug: true } } },
    }),
    findById: (id) => prisma_js_1.prisma.event.findUnique({ where: { id } }),
};
//# sourceMappingURL=event.model.js.map