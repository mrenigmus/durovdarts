import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext, id: number | string | bigint) => {
  const partner = await prisma.partner.findFirst({
    where: { id: Number(id) },
  });

  if (!partner)
    return ctx.reply("❌ Партнёр не найден", {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "admin:partners"),
    });

  const cb = `admin:partner:${partner.id}`;

  return ctx.reply(
    `<b>🤝 ${partner.title}</b>
📌 Тип: <b>${partner.type}</b>
🌍 URL: <b>${partner.url}</b>
⚖️ Приоритет: <b>${partner.priority}</b>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .text("✏️ Изменить приоритет", `${cb}:priority`)
        .row()
        .text("❌ Удалить", `${cb}:del`)
        .row()
        .text(ctx.t("back"), "admin:partners"),
    }
  );
};
