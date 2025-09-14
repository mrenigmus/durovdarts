import partners from "@/handlers/partners";
import playGame from "@/handlers/games/play";
import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { Api, Composer, InlineKeyboard } from "grammy";

const bot = new Composer<MyContext>();

bot.callbackQuery(/^game:(\d+)$/, (ctx) => playGame(ctx, ctx.match[1], true));

export default bot;
