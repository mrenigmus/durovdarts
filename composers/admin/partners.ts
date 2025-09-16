import { MyContext } from "@/types/MyContext";
import { Composer } from "grammy";
import adminMiddleware from "@/middlewares/admin.middleware";
import partners from "@/handlers/admin/partners";
import partner from "@/handlers/admin/partners/partner";
import { prisma } from "@/utils/prisma";

const bot = new Composer<MyContext>();

bot.callbackQuery("admin:partners", adminMiddleware, partners);
bot.callbackQuery("admin:partners:add", adminMiddleware, (ctx) =>
  ctx.conversation.enter("admin:partners:add")
);
bot.callbackQuery(/^admin:partner:(\d+)$/, adminMiddleware, (ctx) =>
  partner(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:partner:(\d+):del$/, adminMiddleware, async (ctx) => {
  await prisma.partner.delete({ where: { id: Number(ctx.match[1]) } });
  return partners(ctx);
});
bot.callbackQuery(/^admin:partner:(\d+):priority$/, adminMiddleware, (ctx) => {
  ctx.session.partnerId = ctx.match[1];
  return  ctx.conversation.enter("admin:partners:priority")
}
);

export default bot;
