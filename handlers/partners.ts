import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import chunk from "chunk";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext) => {
  const partners = await prisma.partner.findMany({
    where: {
      botId: ctx.bot.id,
    },
    orderBy: {
      priority: "desc",
    },
  });

  const reply_markup = new InlineKeyboard();

  chunk(partners, 2).map((v) => {
    reply_markup.row();

    v.map((v) =>
      reply_markup.url(
        v.type == "Channel"
          ? ctx.t("partners.subscribe")
          : ctx.t("partners.run"),
        v.url
      )
    );
  });

  reply_markup
    .row()
    .text(ctx.t("back"), "start")
    .text(ctx.t("partners.check"), `bonus:partners:check`);

  return ctx.reply(ctx.t("partners.text"), {
    parse_mode: "HTML",
    reply_markup,
  });
};
