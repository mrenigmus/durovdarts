import { MyContext } from "@/types/MyContext";
import { prisma } from "@/utils/prisma";
import { InlineKeyboard } from "grammy";

export default async (ctx: MyContext) => {
    const [users, spins, winSpins, nftSent] = await Promise.all([
        prisma.userBot.count({
            where: {
                botId: ctx.bot.id,
            }
        }),
        prisma.spin.count({
            where: {
                botId: ctx.bot.id,
            }
        }),
        prisma.spin.count({ where: { type: "Win", botId: ctx.bot.id} }),
        prisma.gift.count({ where: { isActive: false, isNFT: true } }),
    ]);

    const message = `<b>🔐 Панель администратора</b>

👥 Юзеров: <b>${users}</b>
🎯 Бросков: <b>${spins}</b>
✅ Побед: <b>${winSpins}</b>
🎁 NFT отправлено: <b>${nftSent}</b>`;

    const keyboard = new InlineKeyboard()
        .text(`📤 Отправить рассылку`, `admin:mail`).row()
        .text(`👥 Юзеры`, `admin:users:1`).row()
        .text(`🎮 Варианты игры`, `admin:games`).row()
        .text(`💸 Партнеры`, `admin:partners`).row()
        // .text(`🎁 Гифты`, `admin:gifts:1`).row()
        .text(`⚙️ Настройки`, `admin:settings`).row()
        .text(`◀️ Назад`, `start`);

    return ctx.reply(message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
};
