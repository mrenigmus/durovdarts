import "module-alias/register";
import { config } from "dotenv";
import path from "path";
import { MyContext } from "./types/MyContext";
import { Bot, session } from "grammy";
import { i18n } from "./plugins/I18n";
import authMiddleware from "./middlewares/auth.middleware";
import deleteMessagesMiddleware from "./middlewares/delete-messages.middleware";
import { collectBotMessagesPlugin } from "./middlewares/collect-messages.middleware";
import conversations from "./conversations";
import composers from "./composers";
import start from "./handlers/start";
import playGame from "./handlers/games/play";
import { prisma } from "./utils/prisma";
import referral from "./handlers/referral";
import { GameType, Language } from "./generated/prisma";
import botMiddleware from "./middlewares/bot.middleware";

config({
  path: path.join(__dirname, "./.env"),
});

async function run() {
  const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

  const me = await bot.api.getMe();

  await prisma.bot.upsert({
    where: {
      tgId: me.id,
    },
    update: {
      token: process.env.BOT_TOKEN as string,
      type: process.env.GAME_TYPE! as GameType,
    },
    create: {
      tgId: me.id,
      username: me.username ?? "",
      name: me.first_name ?? "",
      type: process.env.GAME_TYPE! as GameType,
      token: process.env.BOT_TOKEN as string,
      isActive: true,
    },
  });
  bot.catch((err) => {
    console.error("Error in bot:", err);
  });
  const initial = () => ({});
  bot.on("pre_checkout_query", async (ctx) => {
    if (ctx.preCheckoutQuery.invoice_payload.includes("game:")) {
      const gameId = ctx.preCheckoutQuery.invoice_payload.split(":")![1];

      const game = await prisma.game.findFirst({
        where: {
          id: Number(gameId),
          bot: {
            tgId: ctx.me.id,
          },
        },
        include: {
          bot: true,
        },
      });
      if ( game ) return ctx.answerPreCheckoutQuery(true);
    }
     return ctx.answerPreCheckoutQuery(false);
  });
  bot.callbackQuery("none", () => {});

  bot.use(
    session({
      initial,
      //   storage: new PrismaAdapter(prisma.session),
    })
  );
  bot.use(i18n);
  bot.use(botMiddleware);
  bot.use(authMiddleware);
  bot.use(deleteMessagesMiddleware);
  bot.use(collectBotMessagesPlugin());

  await conversations(bot);
  await composers(bot);

  bot.on(":successful_payment", (ctx) => {
    const regexp = /^game:(\d+)$/;
    const payload = ctx.message?.successful_payment.invoice_payload!;
    if (regexp.test(payload)) return playGame(ctx, regexp.exec(payload)![1]);
  });

  bot.hears(/^\/start r(\d+)$/, async (ctx, next) => {
    if (ctx.user.referrerId) return next();

    const referrer = await prisma.user.findFirst({
      where: {
        tgId: {
          equals: Number(ctx.match[1]),
          not: ctx.user.tgId,
        },
      },
    });
    if (!referrer) return next();

    await prisma.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        referrerId: referrer.id,
      },
    });

    return next();
  });

  bot.callbackQuery("start", start);
  bot.command("start", start);

  bot.callbackQuery("referral", referral);
bot.callbackQuery(/^lang_(En|Ru)$/, async (ctx) => {
    await prisma.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        language: ctx.match[1] as Language,
      },
    });
    ctx.user.language = ctx.match[1] as Language;
    ctx.session.language = ctx.user.language!;
    ctx.i18n.useLocale(ctx.user.language!);
    await ctx
      .answerCallbackQuery({
        text: "✅",
      })
      .catch((e) => e);

    await start(ctx);
  });
  await prisma.$connect();
  bot.start({
    onStart: () => console.log("Bot started successfully"),
  });
}

run();
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  // возможно логирование в файл или сервис
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // возможно логирование или graceful shutdown
});
