import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { getSetting } from "@/utils/settings";
import { InlineKeyboard } from "grammy";
import { escape } from "querystring";

export default async (ctx: MyContext) => {
  const referrals = await prisma.user.count({
    where: {
      referrerId: ctx.user.id,
    },
  });

  let url = `https://t.me/share/url?url=`;

  url += escape(
    ctx.t("referral.share-text", {
      url: `https://t.me/${ctx.me.username}?start=r${ctx.from!.id}`,
    })
  );
  return ctx.reply(
    ctx.t("referral.text", {
      count: (await getSetting<string>("ref:reward"))!,
      requirement: (await getSetting<string>("ref:requirement"))!,
    }),
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url(ctx.t("referral.share"), url)
        .row()
        .text(ctx.t("back"), "start"),
    }
  );
};
