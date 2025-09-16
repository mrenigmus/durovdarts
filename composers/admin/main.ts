
import { MyContext } from "@/types/MyContext";
import {  Composer } from "grammy";
import admin from "@/handlers/admin";
import adminMiddleware from "@/middlewares/admin.middleware";

const bot = new Composer<MyContext>();

bot.callbackQuery("admin", adminMiddleware, admin);
bot.command("admin", adminMiddleware, admin);

bot.callbackQuery("admin:mail", adminMiddleware, (ctx) =>
  ctx.conversation.enter("admin:mail")
);
export default bot;
