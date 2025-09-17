import "module-alias/register";
import { Api, InlineKeyboard, InputFile } from "grammy";
import { config } from "dotenv";
import path from "path";
import { prisma } from "@/utils/prisma";
import { i18n } from "@/plugins/I18n";

config({ path: path.join(__dirname, "../.env") });

const bot = new Api(process.env.BOT_TOKEN!);
const BATCH_SIZE = 30;
const BATCH_DELAY = 1500; // мс между батчами

async function checkUsers() {
  const txs = await prisma.transaction.findMany({
    where: {
      type: "Reward",
      meta: {
        path: "$.by",
        equals: "partners",
      },
      createdAt: {
        gte: new Date(Date.now() - 25 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      user: {
        isMailBanned: false,
      },
    },
    include: {
      user: true,
    },
  });

  const users = txs
    .map((tx) => tx.user)
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const image = new InputFile(path.join(__dirname, "../images/stars.png"));

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          const lang = user.language.toLowerCase();
          // создаём локализатор для языка юзера
          const text = i18n.t(lang, "notify.rewards");

          await bot.sendPhoto(Number(user.tgId), image, {
            caption: text,
            parse_mode: "HTML",
            reply_markup: new InlineKeyboard().text(
              i18n.t(lang, "notify.rewards-receive"),
              "bonus:partners"
            ),
          });
        } catch (err: any) {}
      })
    );

    await new Promise((res) => setTimeout(res, BATCH_DELAY));
  }

  setTimeout(checkUsers, 60 * 60 * 1000);
}

checkUsers();
