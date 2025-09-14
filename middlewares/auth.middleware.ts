import { prisma } from "@/utils/prisma";
import { MyContext } from "@/types/MyContext";
import { InlineKeyboard, NextFunction } from "grammy";

export default async (ctx: MyContext, next: NextFunction) => {
  if (ctx.preCheckoutQuery) return next();
  if (!ctx.from?.id) return;

  let user = await prisma.user.findFirst({
    where: {
      tgId: ctx.from.id,
    },
  });

  let username = (ctx.from.username || ctx.from.id).toString();

  if (!user)
    user = await prisma.user.create({
      data: {
        tgId: ctx.from.id,
        username,
        language: "Ru",
      },
    });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      username,
      lastSeenAt: new Date(),
    },
  });

  ctx.user = user;
  if (!ctx.session.lastMessageIds) ctx.session.lastMessageIds = [];
  if (ctx.user.language) ctx.i18n.useLocale(ctx.user.language);
  if (ctx.user.isBanned) return;
  if (!ctx.from.username && ctx.from?.id == ctx.chat?.id)
    return ctx.reply(ctx.t("need-username"), {
      reply_markup: new InlineKeyboard().text(ctx.t("main-menu"), "start"),
    });

  return next();
};
