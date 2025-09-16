
import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import {  Composer } from "grammy";
import adminMiddleware from "@/middlewares/admin.middleware";
import users from "@/handlers/admin/users";
import user from "@/handlers/admin/users/user";

const bot = new Composer<MyContext>();
bot.callbackQuery(/^admin:users:(\d+)$/, adminMiddleware, (ctx) =>
  users(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:user:(\d+)$/, adminMiddleware, (ctx) =>
  user(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:user:(\d+):edit:balance$/, adminMiddleware, (ctx) => {
  ctx.session.userId = ctx.match[1];
  return ctx.conversation.enter("admin:user:edit:balance");
});
bot.callbackQuery(
  /^admin:user:(\d+):toggle:isBanned$/,
  adminMiddleware,
  async (ctx) => {
    const us = await prisma.user.findFirstOrThrow({
      where: {
        id: Number(ctx.match[1]),
      },
    });

    await prisma.user.update({
      where: {
        id: us.id,
      },
      data: {
        isBanned: !us.isBanned,
      },
    });

    return user(ctx, us.id);
  }
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
