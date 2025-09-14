import { MyContext } from "@/types/MyContext";
import { NextFunction } from "grammy";

export default async (ctx: MyContext, next: NextFunction) => {
    if (ctx.preCheckoutQuery) return next();
  try {
    if (
      Array.isArray(ctx.session?.botMessageIds) &&
      ctx.session.botMessageIds.length > 0
    ) {
      // Удаляем сообщения по одному, чтобы не терять остальные при ошибке
      await ctx.api.deleteMessages(ctx.chat!.id, ctx.session.botMessageIds);
      ctx.session.botMessageIds = [];
    }
  } catch (error) {
    console.error("Error in messages middleware:", error);
  }

  await next();
};
