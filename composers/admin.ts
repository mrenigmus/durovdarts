import partners from "@/handlers/partners";
import playGame from "@/handlers/games/play";
import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { Api, Composer, InlineKeyboard } from "grammy";
import admin from "@/handlers/admin";
import adminMiddleware from "@/middlewares/admin.middleware";
import users from "@/handlers/admin/users";

const bot = new Composer<MyContext>();
bot.callbackQuery("admin", adminMiddleware, admin);
bot.command("admin", adminMiddleware, admin);

bot.callbackQuery("admin:mail", adminMiddleware, ctx => ctx.conversation.enter("admin:mail"))
bot.callbackQuery(/^admin:users:(\d+)$/, adminMiddleware, ctx => users(ctx, ctx.match[1]))
export default bot;
