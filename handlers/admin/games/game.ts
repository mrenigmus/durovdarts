import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext, id: number | string | bigint) => {
  const game = await prisma.game.findFirst({
    where: {
      id: Number(id),
    },
  });

  if (!game)
    return ctx.reply("❌ Игра не найдена", {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "admin:games"),
    });

  const cb = `admin:game:${game.id}`;

  return ctx.reply(
    `<b>🎮 Игра №${game.id}</b>
🔢 Кол-во: <b>${game.count}</b>
💰 Цена: <b>${game.price}</b>
🎁 NFT режим: <b>${game.nftMode ? "вкл" : "выкл"}</b>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()

        .text(`❌ Удалить`, `${cb}:del`)
        .row()
        .text(ctx.t("back"), "admin:games"),
    }
  );
};
