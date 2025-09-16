import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext, key: string) => {
  const setting = await prisma.settings.findUnique({ where: { key } });

  if (!setting)
    return ctx.reply("❌ Настройка не найдена", {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "admin:settings"),
    });

  const cb = `admin:setting:${setting.key}`;

  return ctx.reply(
    `<b>⚙️ ${setting.key}</b>
Тип: <b>${setting.type}</b>
Значение: <b>${setting.value ?? "—"}</b>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .text("✏️ Изменить", "admin:settings:edit")
        .row()
        .text("❌ Удалить", `${cb}:del`)
        .row()
        .text(ctx.t("back"), "admin:settings"),
    }
  );
};
