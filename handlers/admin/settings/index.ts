import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext) => {
  const settings = await prisma.settings.findMany({
    orderBy: { key: "asc" },
  });

  const kb = new InlineKeyboard();
  kb.text("➕ Добавить / изменить", "admin:settings:edit").row();

  for (const s of settings) {
    kb.text(`${s.key} = ${s.value}`, `admin:setting:${s.key}`).row();
  }

  kb.text(ctx.t("back"), "admin");

  return ctx.reply("⚙️ Настройки", { reply_markup: kb });
};
