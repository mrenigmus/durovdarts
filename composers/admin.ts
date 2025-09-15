import partners from "@/handlers/partners";
import playGame from "@/handlers/games/play";
import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { Api, Composer, InlineKeyboard } from "grammy";
import admin from "@/handlers/admin";
import adminMiddleware from "@/middlewares/admin.middleware";
import users from "@/handlers/admin/users";
import user from "@/handlers/admin/users/user";

const bot = new Composer<MyContext>();
bot.callbackQuery("admin", adminMiddleware, admin);
bot.command("admin", adminMiddleware, admin);

bot.callbackQuery("admin:mail", adminMiddleware, (ctx) =>
  ctx.conversation.enter("admin:mail")
);
bot.callbackQuery(/^admin:users:(\d+)$/, adminMiddleware, (ctx) =>
  users(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:user:(\d+)$/, adminMiddleware, (ctx) =>
  user(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:user:(\d+)$/, adminMiddleware, (ctx) =>
  user(ctx, ctx.match[1])
);
bot.hears(/^\/user (@?[A-Za-z0-9_]+)$/, adminMiddleware, async (ctx) => {
  const input = ctx.match[1].replace("@", "");

  const us = await prisma.user.findFirst({
    where: {
      OR: [
        { username: input },
        { id: isNaN(Number(input)) ? undefined : Number(input) },
        { tgId: isNaN(Number(input)) ? undefined : Number(input) },
      ].filter(Boolean), // убираем undefined
    },
  });

  if (!us) {
    return ctx.reply("❌ Пользователь не найден");
  }

  return user(ctx, us.id);
});

bot.hears(/^\/start a_u_(\d+)$/, adminMiddleware, (ctx) =>
  user(ctx, ctx.match[1])
);
export default bot;
