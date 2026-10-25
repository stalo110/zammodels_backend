import { prisma } from "../lib/prisma.js";

export const settingsModel = {
  get: (key: string) =>
    prisma.siteSetting.findUnique({
      where: { key },
      select: { key: true, value: true, description: true, updatedAt: true },
    }),
  set: (key: string, value: string, description?: string) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value, description: description ?? null },
      create: { key, value, description: description ?? null },
      select: { key: true, value: true, description: true, updatedAt: true },
    }),
  getRegistrationEnabled: async () => {
    const value = await settingsModel.get("REGISTRATION_ENABLED");
    if (!value) return true;
    return value.value !== "false";
  },
  setRegistrationEnabled: (enabled: boolean) =>
    settingsModel.set(
      "REGISTRATION_ENABLED",
      String(enabled),
      "Whether the public audition form is open for submissions.",
    ),
};
