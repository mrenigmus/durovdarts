import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { InlineKeyboard } from "grammy";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function playGame(
  ctx: MyContext,
  gameId: string | number,
  decrementFromBalance: boolean = false
) {
  if (ctx.callbackQuery) ctx.answerCallbackQuery().catch((e) => e);
  const userId = ctx.user?.id;
  if (!userId) {
    return ctx.api.sendMessage(ctx.from!.id, "⚠️ Пользователь не найден");
  }

  const game = await prisma.game.findUnique({
    where: { id: Number(gameId), botId: ctx.bot.id },
  });
  if (!game) {
    return ctx.api.sendMessage(ctx.from!.id, ctx.t("games.not-found"), {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "start"),
    });
  }

  const emoji = "🎯";
  const duration = getDiceDuration(emoji);

  return prisma.$transaction(async (tx) => {
    // списываем баланс
    if (decrementFromBalance) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < game.price) {
        return ctx.api.sendMessage(
          ctx.from!.id,
          ctx.t("games.not-enough-funds"),
          {
            reply_markup: new InlineKeyboard().text(ctx.t("back"), "start"),
          }
        );
      }

      ctx.user = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: game.price } },
      });
    }

    // броски кубиков
    let results: any[] = [];
    let diceError = false;

    const nftGifts = await tx.gift.findMany({
      where: {
        isWinNFT: true,
      },
    });

    await ctx.api.sendMessage(
      ctx.from!.id,
      ctx.t(`games.spinning${game.nftMode ? "-nft" : ""}`, {
        nftGifts: nftGifts.map((v) => v.title!).join(""),
      }),
      {
        parse_mode: "HTML",
      }
    );
    for (let i = 0; i < game.count; i++) {
      try {
        const r = await ctx.api.sendDice(ctx.from!.id, emoji);
        results.push(r);
      } catch (err) {
        console.error("sendDice failed:", err);
        diceError = true;
        results.push(null);
      }
    }

    // если ошибка в кубиках — автоматический проигрыш
    const win =
      !diceError &&
      results.length > 0 &&
      results.every((r) => r?.dice?.value === 6);

    const spin = await tx.spin.create({
      data: {
        userId,
        gameId: game.id,
        botId: ctx.bot.id,
        count: game.count,
        gameType: game.type,
        results,
        type: win ? "Win" : "Lose",
        nftMode: game.nftMode,
      },
    });

    await tx.transaction.create({
      data: {
        botId: ctx.bot.id,
        userId: ctx.user.id,
        amount: game.price,
        type: "Spin",
        meta: {
          spinId: spin.id,
        },
      },
    });

    if (ctx.user.referrerId) {
      const spinCount = await tx.spin.count({
        where: {
          botId: ctx.bot.id,
          userId: ctx.user.id,
        },
      });

      const rewardTx = await tx.transaction.findFirst({
        where: {
          botId: ctx.bot.id,
          userId: ctx.user.referrerId,
          type: "Reward",
          meta: {
            path: "$.referralId",
            equals: ctx.user.id,
          },
        },
      });
      const [amount, requirement] = [
        (await getSetting<number>("ref:reward"))!,
        (await getSetting<number>("ref:requirement"))!,
      ];
      if (!rewardTx && spinCount >= requirement) {
        await tx.transaction.create({
          data: {
          botId: ctx.bot.id,
            userId: ctx.user.referrerId,
            type: "Reward",
            meta: {
              referralId: ctx.user.id,
            },
            amount,
          },
        });
        await tx.user.update({
          where: {
            id: ctx.user.referrerId,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
      }
    }

    await sleep(duration);

    const reply_markup = new InlineKeyboard();

    if (ctx.user.balance >= game.price)
      reply_markup.text(ctx.t("games.spin"), `game:${game.id}`);
    else reply_markup.url(ctx.t("games.spin"), game.invoiceUrl!);

    reply_markup.row().text(ctx.t("back"), "start");
    try {
      if (!win) {
        let details = "";

        if (game.count > 1) {
          details =
            "\n\n" +
            results
              .map((r, i) =>
                r?.dice?.value === 6
                  ? `${i + 1}. <b>✅ ${ctx.t("games.hit")}</b>`
                  : `${i + 1}. <b>❌ ${ctx.t("games.miss")}</b>`
              )
              .join("\n");
        }

        await ctx.api.sendMessage(ctx.from!.id, ctx.t("games.lose") + details, {
          reply_markup,
          parse_mode: "HTML",
        });
        return;
      }
      // всегда выбираем обычный подарок
      const normalGift = await getRandomGift(false);
      if (!normalGift) {
        await ctx.api.sendMessage(ctx.from!.id, ctx.t("games.no-gifts"), {
          reply_markup,
          parse_mode: "HTML",
        });
        return;
      }

      // сохраняем результат
      await tx.spin.update({
        where: { id: spin.id },
        data: {
          giftId: normalGift.id,
        },
      });

      // отправляем подарки
      await ctx.api.sendGift(ctx.from!.id, normalGift.giftId!);
      await tx.spin.update({
        where: { id: spin.id },
        data: {
          giftTransferedAt: new Date(),
        },
      });

      await ctx.api.sendMessage(
        ctx.from!.id,
        ctx.t(`games.win${spin.nftMode && normalGift.isWinNFT ? "-nft" : ""}`, {
          username: (await getSetting<string>("gift-relayer"))!,
        }),
        {
          reply_markup,
          parse_mode: "HTML",
        }
      );
    } catch (err) {
      console.error("Gift send failed", err);
      await ctx.api.sendMessage(ctx.from!.id, ctx.t("games.error"), {
        reply_markup,
        parse_mode: "HTML",
      });
    }
  });
}

/**
 * Получить случайный подарок
 * @param nft true → NFT, false → обычный
 */
async function getRandomGift(nft: boolean) {
  const gifts = await prisma.gift.findMany({
    where: { isActive: true, isNFT: nft },
  });
  if (!gifts.length) return null;
  return gifts[Math.floor(Math.random() * gifts.length)];
}

function getDiceDuration(emoji: string): number {
  const durations: Record<string, number> = {
    "🎯": 3000,
    "🎲": 2000,
    "🏀": 2800,
    "⚽": 2800,
  };
  return durations[emoji] ?? 3000;
}
