import partners from "@/handlers/partners";
import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { Api, Composer, InlineKeyboard } from "grammy";

const bot = new Composer<MyContext>();

bot.callbackQuery("bonus:partners", partners);
bot.callbackQuery("bonus:partners:check", async (ctx) => {
  const lastPartnersReceived = await prisma.transaction.findFirst({
    where: {
      userId: ctx.user.id,
      type: "Reward",
      meta: {
        path: "$.by",
        equals: "partners",
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (lastPartnersReceived)
    return ctx.reply(ctx.t("partners.timeout"), {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "start"),
    });

  const partners = await prisma.partner.findMany({
    orderBy: {
      priority: "desc",
    },
  });
  let joinedAll = true;

  for (let p of partners) {
    try {
      if (p.type == "Bot" && p.botToken) {
        let api = new Api(p.botToken);
        await api.sendChatAction(ctx.from.id, "typing");
      } else {
        let chatUser = await ctx.api.getChatMember(
          Number(p.channelId),
          ctx.from.id
        );
        if (["left", "kicked"].includes(chatUser.status)) throw false;
      }
    } catch (err) {
      joinedAll = false;
    }
  }

  if (!joinedAll)
    return ctx.reply(ctx.t("partners.error"), {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "bonus:partners"),
    });

  const amount = await getSetting<number>("partner:reward");
  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: ctx.user.id,
        amount: amount!,
        type: "Reward",
        meta: {
          by: "partners",
        },
      },
    });
    await tx.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        balance: {
          increment: amount!,
        },
      },
    });
  });

  return ctx.reply(
    ctx.t("partners.success", {
      amount: amount!.toString(),
    }),
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "start"),
    }
  );
});

export default bot;
