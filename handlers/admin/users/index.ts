import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import chunk from "chunk";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext, page: number | string) => {
  const [users, meta] = await prisma.userBot
    .paginate({
      orderBy: {
        id: "desc",
      },
      where: {
        botId: ctx.bot.id,
      },
      include: {
        user: true,
      }
    })
    .withPages({
      page: Number(page),
      limit: 30,
      includePageCount: true,
    });

  const reply_markup = new InlineKeyboard();

  chunk(users, 3).map((v) => {
    reply_markup.row();
    v.map((v) =>
      reply_markup.text(
        `${v.user.username ? v.user.username : v.user.tgId}`,
        `admin:user:${v.id}`
      )
    );
  });

  reply_markup.row().text(ctx.t("back"), "admin");

  return ctx.reply(
    `👥 Пользователи <i>(Всего: <b>${meta.totalCount})</b></i>`,
    {
      parse_mode: "HTML",
      reply_markup,
    }
  );
};
