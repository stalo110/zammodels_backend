"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.settingsModel = {
    get: (key) => prisma_js_1.prisma.siteSetting.findUnique({
        where: { key },
        select: { key: true, value: true, description: true, updatedAt: true },
    }),
    set: (key, value, description) => prisma_js_1.prisma.siteSetting.upsert({
        where: { key },
        update: { value, description: description ?? null },
        create: { key, value, description: description ?? null },
        select: { key: true, value: true, description: true, updatedAt: true },
    }),
    getRegistrationEnabled: async () => {
        const value = await exports.settingsModel.get("REGISTRATION_ENABLED");
        if (!value)
            return true;
        return value.value !== "false";
    },
    setRegistrationEnabled: (enabled) => exports.settingsModel.set("REGISTRATION_ENABLED", String(enabled), "Whether the public audition form is open for submissions."),
};
//# sourceMappingURL=settings.model.js.map