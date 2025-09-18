import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import chunk from "chunk";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext) => {
  const games = await prisma.game.findMany({
    where: {
      botId: ctx.bot.id,
    },
    orderBy: {
      price: "asc",
    },
  });

  const reply_markup = new InlineKeyboard();

  reply_markup.text(`➕ Добавить`, `admin:games:add`).row();

  chunk(games, 2).map((v) => {
    reply_markup.row();
    v.forEach((g) =>
      reply_markup.text(
        `🎯${g.nftMode ? "💎" : ""} ${ctx.t("plurals.darts", {
          count: g.count,
        })} • ${g.price} ⭐`,
        `admin:game:${g.id}`
      )
    );
  });

  reply_markup.row().text(ctx.t("back"), "admin");

  return ctx.reply(`🎮 Варианты игры`, {
    reply_markup,
  });
};
