import { MyContext } from "@/types/MyContext";
import { Composer } from "grammy";
import adminMiddleware from "@/middlewares/admin.middleware";
import settings from "@/handlers/admin/settings";
import setting from "@/handlers/admin/settings/setting";
import { prisma } from "@/utils/prisma";

const bot = new Composer<MyContext>();

bot.callbackQuery("admin:settings", adminMiddleware, settings);
bot.callbackQuery("admin:settings:edit", adminMiddleware, (ctx) =>
  ctx.conversation.enter("admin:settings:edit")
);
bot.callbackQuery(/^admin:setting:(.+)$/, adminMiddleware, (ctx) =>
  setting(ctx, ctx.match[1])
);
bot.callbackQuery(/^admin:setting:(.+):del$/, adminMiddleware, async (ctx) => {
  await prisma.settings.delete({ where: { key: ctx.match[1] } });
  return settings(ctx);
});

export default bot;
