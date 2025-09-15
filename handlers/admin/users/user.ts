import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext, id: number | string | bigint) => {
  const user = await prisma.user.findFirst({
    where: {
      id: Number(id),
    },
    include: {
      referrer: true,
    },
  });

  if (!user)
    return ctx.reply("❌ Пользователь не найден", {
      reply_markup: new InlineKeyboard().text(ctx.t("back"), "admin:users:1"),
    });

  const [spins, winSpins, nftReceived] = await Promise.all([
    prisma.spin.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.spin.count({
      where: { type: "Win", userId: user.id },
    }),
    prisma.spin.count({
      where: {
        userId: user.id,
        type: "Win",
        nftMode: true,
        nftGiftTransferedAt: {
          not: null,
        },
      },
    }),
  ]);

  const cb = `admin:user:${user.id}`;

  return ctx.reply(
    `👤 Пользователь <b>@${user.username}</b>
🆔 ID: <b>${user.id} (<code>${user.tgId}</code>)</b>
🎯 Бросков: <b>${spins}</b>
✅ Побед: <b>${winSpins}</b>
🎁 NFT получено: <b>${nftReceived}</b>
💰 Баланс: <b>${user.balance}</b>
🔗 Реферер: <b>${
      user.referrer
        ? `<a href="https://t.me/${ctx.me.username}?start=a_u_${user.referrerId}">@${user.referrer.username}</a>`
        : "нету"
    }</b>
📝 Заблокировал бота: <b>${user.isMailBanned ? "✅ Да" : "❌ Нет"}</b>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .text(`💰 Изменить баланс`, `${cb}:edit:balance`)
        .row()
        .text(
          user.isBanned ? `✅ Разблокировать` : `❌ Заблокировать`,
          `${cb}:toggle:isBanned`
        )
        .row()
        .text(ctx.t("back"), "admin:users:1"),
    }
  );
};
