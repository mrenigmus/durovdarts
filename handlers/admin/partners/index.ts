import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext) => {
  const partners = await prisma.partner.findMany({
    orderBy: {
      priority: "desc",
    },
  });

  const kb = new InlineKeyboard();
  kb.text("➕ Добавить", "admin:partners:add").row();

  for (const p of partners) {
    kb.text(`${p.type === "Bot" ? "🤖" : "📢"} ${p.title}`, `admin:partner:${p.id}`).row();
  }

  kb.text(ctx.t("back"), "admin");

  return ctx.reply("🤝 Партнёры", { reply_markup: kb });
};
