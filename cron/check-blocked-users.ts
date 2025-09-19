import "module-alias/register";
import { Api } from "grammy";
import { config } from "dotenv";
import path from "path";
import { prisma } from "@/utils/prisma";

config({ path: path.join(__dirname, "../.env") });

const BATCH_SIZE = 30;
const BATCH_DELAY = 1500; // мс между батчами

async function checkUsers() {
  const users = await prisma.userBot.findMany({

    include: {
      user: true,
      bot: true,
    },
    orderBy: {
      isMailBanned: "asc",
    },
  });

  const idsToBan: number[] = [];
  const idsToUnban: number[] = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          console.log(`Checking: `, user.user.tgId);
          const bot = new Api(user.bot!.token!);
          await bot.sendChatAction(Number(user.user.tgId), "typing");
          idsToUnban.push(Number(user.id));
        } catch (err: any) {
          if (err?.error_code === 403 || err?.error_code === 400) {
            idsToBan.push(Number(user.id));
          } else {
            console.error(`⚠️ Ошибка для ${user.user.tgId}:`, err);
          }
        }
      })
    );

    await new Promise((res) => setTimeout(res, BATCH_DELAY));
  }

  if (idsToBan.length) {
    await prisma.userBot.updateMany({
      where: { id: { in: idsToBan } },
      data: { isMailBanned: true },
    });
  }

  if (idsToUnban.length) {
    await prisma.userBot.updateMany({
      where: { id: { in: idsToUnban } },
      data: { isMailBanned: false },
    });
  }

  console.log(
    `✅ Готово. Забанено: ${idsToBan.length}, разблокировано: ${idsToUnban.length}`
  );
}

const run = async () => {
  await checkUsers();
  setTimeout(run, 60 * 60 * 1000);
};

run();

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
