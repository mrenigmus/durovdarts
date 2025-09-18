import { prisma } from "@/utils/prisma";
import { MyContext } from "@/types/MyContext";
import { InlineKeyboard, NextFunction } from "grammy";

export default async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.me?.id) return;

  let bot = await prisma.bot.findFirstOrThrow({
    where: {
      tgId: ctx.me.id,
    },
  });

  ctx.bot = bot;
  
  return next();
};
