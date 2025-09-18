import { MyContext } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { prisma } from "@/utils/prisma";
import escapeHTML from "escape-html";
import chunk from "chunk";
import { getSetting } from "@/utils/settings";
import { Game } from "@/generated/prisma";

/**
 * Создание ссылки для оплаты игры
 */
async function createInvoiceUrl(ctx: MyContext, game: Game) {
  const title =
    `🎯 ` +
    ctx.t("plurals.darts", {
      count: game.count,
    });
  const url = await ctx.api.createInvoiceLink(
    title, // title
    title, // description
    `game:${game.id}`, // payload
    "", // provider token (Stars/XTR)
    "XTR", // currency
    [{ label: title, amount: game.price }]
  );

  return url;
}

export default async function startHandler(ctx: MyContext) {
  // Загружаем все активные игры
  const games = await prisma.game.findMany({
    where: {
      botId: ctx.bot.id,
    },
    orderBy: { price: "asc" },
  });

  const updatedGames: typeof games = [];

  // Проверяем наличие invoiceUrl, пересоздаём при изменении price
  for (const game of games) {
    let url = game.invoiceUrl;

    if (!url) {
      url = await createInvoiceUrl(ctx, game);
      const updated = await prisma.game.update({
        where: { id: game.id },
        data: { invoiceUrl: url },
      });
      updatedGames.push(updated);
    } else {
      updatedGames.push(game);
    }
  }

  // Формируем inline-клавиатуру (по 2 кнопки в строке)
  const reply_markup = new InlineKeyboard();

  reply_markup.text(
    ctx.t("start.free", {
      count: (await getSetting<string>("partner:reward"))!,
    }),
    "bonus:partners"
  );

  for (const row of chunk(updatedGames, 2)) {
    reply_markup.row();
    row.forEach((g) => {
      if (g.invoiceUrl && ctx.user.balance < g.price) {
        reply_markup.url(
          `🎯${g.nftMode ? "💎" : ""} ${ctx.t("plurals.darts", {
            count: g.count,
          })} • ${g.price} ⭐`,
          g.invoiceUrl
        );
      } else if (ctx.user.balance >= g.price)
        reply_markup.text(
          `🎯${g.nftMode ? "💎" : ""} ${ctx.t("plurals.darts", {
            count: g.count,
          })} • ${g.price} ⭐`,
          `game:${g.id}`
        );
    });
  }

  reply_markup.row().text(
    ctx.t("start.ref", {
      count: (await getSetting<string>("ref:reward"))!,
    }),
    "referral"
  );

  if (ctx.user.language == "Ru")
    reply_markup.row().text(`🇺🇸 English`, `lang_En`);
  else reply_markup.row().text(`🇷🇺 Русский язык`, `lang_Ru`);

  if (ctx.user.role == "Admin")
    reply_markup.row().text(`🔐 Панель администратора`, `admin`);

  return ctx.reply(
    ctx.t("start.text", {
      name: escapeHTML(
        String(ctx.from?.first_name || ctx.from?.username || ctx.from?.id)
      ),
      balance: ctx.user.balance,
    }),
    { parse_mode: "HTML", reply_markup }
  );
}
