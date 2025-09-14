import "module-alias/register";
import { Api, InlineKeyboard } from "grammy";
import { User } from "@/generated/prisma";
import { prisma } from "@/utils/prisma";
import { i18n } from "@/plugins/I18n";

const { CHAT_ID, MESSAGE_CHAT_ID, MESSAGE_ID, BOT_TOKEN } = process.env;

(async () => {
  try {
    const chatId = Number(CHAT_ID);
    const message = {
      chat_id: Number(MESSAGE_CHAT_ID),
      message_id: Number(MESSAGE_ID),
    };
    console.log(message);
    const users = await prisma.user.findMany({
      where: {
        isMailBanned: false,
      },
    });

    await prisma.$disconnect();

    const bot = new Api(BOT_TOKEN as string);

    let success = 0;
    let errors = 0;
    const batchSize = 20;

    const formatProgress = (status: string) =>
      `<b>${status}</b>\n\n<i>📊 Прогресс:</i>\n✅ Успехов: <b>${success}</b>\n❌ Ошибок: <b>${errors}</b>`;

    const progressMessage = await bot.sendMessage(
      chatId,
      formatProgress("👥 Собираем список пользователей..."),
      {
        parse_mode: "HTML",
      }
    );

    await bot
      .editMessageText(
        chatId,
        progressMessage.message_id,
        formatProgress(
          `✅ Пользователей собрано: ${users.length}\n📤 Начинаем рассылку...`
        ),
        {
          parse_mode: "HTML",
        }
      )
      .catch(() => {});

    const sendMessage = async (user: User) => {
      try {
        await bot.copyMessage(
          Number(user.tgId),
          message.chat_id,
          message.message_id
        );
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    };

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(
        batch.map((user) =>
          sendMessage(user).then((ok) => {
            if (ok) success++;
            else errors++;
          })
        )
      );

      await bot
        .editMessageText(
          chatId,
          progressMessage.message_id,
          formatProgress(`📤 Рассылка продолжается...`),
          {
            parse_mode: "HTML",
          }
        )
        .catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    await bot
      .editMessageText(
        chatId,
        progressMessage.message_id,
        formatProgress(`✅ Рассылка завершена!`),
        {
          parse_mode: "HTML",
        }
      )
      .catch(() => {});
  } catch (err) {
    console.error(err);
  } finally {
    process.send?.("done");
  }
})();
