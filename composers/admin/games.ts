import { MyContext } from "@/types/MyContext";
import { Composer } from "grammy";
import admin from "@/handlers/admin";
import adminMiddleware from "@/middlewares/admin.middleware";
import games from "@/handlers/admin/games";
import { prisma } from "@/utils/prisma";
import game from "@/handlers/admin/games/game";

const bot = new Composer<MyContext>();

bot.callbackQuery("admin:games", adminMiddleware, games);
bot.callbackQuery("admin:games:add", adminMiddleware, (ctx) =>
  ctx.conversation.enter("admin:games:add")
);
bot.callbackQuery(/^admin:game:(\d+)$/, adminMiddleware, (ctx) =>
  game(ctx, ctx.match[1])
);

bot.callbackQuery(/^admin:game:(\d+):del$/, adminMiddleware, async (ctx) => {
  await prisma.game.delete({
    where: {
      id: Number(ctx.match[1]),
    },
  });

  return games(ctx);
});

export default bot;
