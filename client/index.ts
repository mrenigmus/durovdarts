import "module-alias/register";
import { prisma } from "@/utils/prisma";
import { SavedStarGift, StarGiftUnique, TelegramClient } from "@mtcute/bun";
import { config } from "dotenv";
import path from "path";
config({
  path: path.join(__dirname, "../.env"),
});

const tg = new TelegramClient({
  apiId: Number(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH! as string,
  storage: path.join(__dirname, "./sessions/client.session"),
  initConnectionOptions: {
    deviceModel: "iPhone 13 Pro",
    systemVersion: "iOS 15.4",
    appVersion: "9.6.2",
    systemLangCode: "en",
    langPack: "en",
    langCode: "en",
  },
});
// ==== Helpers ====
function isUniqueGift(g: SavedStarGift["gift"]): g is StarGiftUnique {
  return (
    !!g &&
    typeof (g as any).num === "number" &&
    typeof (g as any).slug === "string"
  );
}
function isTransferableDate(d: Date | null) {
  return !!d && d.getTime() <= Date.now();
}
type PriceQuery = {
  name: string; // gift title (или slug-подпись, если ваш резолвер поддерживает)
  model?: string | null;
  backdrop?: string | null;
  pattern?: string | null;
};

type PriceResult =
  | {
      ok: true;
      priceStars: number;
      usedAttributes: {
        model?: string;
        backdrop?: string;
        pattern?: string;
      };
    }
  | {
      ok: false;
      error: string;
    };
type TransferableDto = {
  num: number;
  title: string;
  model: string;
  backdrop: string;
  symbol: string;
  slug: string;
  ownerId: number | null;
  transferStars: string | null;
  canTransferAt: string | null;
  savedId: string | null; // может быть null
  messageId: number | null; // fallback для transfer
};
async function fetchTransferableUniques(): Promise<{
  dtos: TransferableDto[];
  mapByKey: Map<string, SavedStarGift>;
}> {
  const dtos: TransferableDto[] = [];
  const mapByKey = new Map<string, SavedStarGift>(); // ключи: saved:<id>, msg:<id>, num:<num>

  let offset: string | undefined = undefined;
  do {
    const page = await tg.getSavedStarGifts({
      owner: "me",
      excludeHidden: true,
      excludeUpgradable: true,
      excludeUnupgradable: true,
      excludeUnlimited: true,
      limit: 200,
      offset,
    });

    for (const it of page) {
      const g = it.gift;
      if (!isUniqueGift(g)) continue;
      if (!isTransferableDate(it.canTransferAt)) continue;

      const dto: TransferableDto = {
        num: g.num,
        title: g.title,
        model: g.model.name,
        symbol: g.pattern.name,
        backdrop: g.backdrop.name,
        slug: g.slug,
        ownerId: g.ownerId ?? null,
        transferStars: it.transferStars ? String(it.transferStars) : null,
        canTransferAt: it.canTransferAt ? it.canTransferAt.toISOString() : null,
        savedId: it.savedId ? String(it.savedId) : null,
        messageId: it.messageId ?? null,
      };
      dtos.push(dto);

      if (it.savedId) mapByKey.set(`saved:${String(it.savedId)}`, it);
      if (it.messageId) mapByKey.set(`msg:${it.messageId}`, it);
      mapByKey.set(`num:${g.num}`, it);
    }

    offset = page.next;
  } while (offset);

  return { dtos, mapByKey };
}

interface SendGiftOptions {
  toId: number | string;
  savedId?: string;
  messageId?: number;
  num?: number;
}

export async function sendGift(options: SendGiftOptions) {
  const { toId, savedId, messageId, num } = options;

  if (
    !toId ||
    (!savedId && typeof messageId !== "number" && typeof num !== "number")
  ) {
    throw new Error(
      "BAD_REQUEST: toId и один из savedId|messageId|num обязательны"
    );
  }

  const { mapByKey } = await fetchTransferableUniques();

  // приоритет: savedId → messageId → num
  let chosen =
    (savedId ? mapByKey.get(`saved:${String(savedId)}`) : undefined) ??
    (typeof messageId === "number"
      ? mapByKey.get(`msg:${messageId}`)
      : undefined) ??
    (typeof num === "number" ? mapByKey.get(`num:${num}`) : undefined);

  if (!chosen) {
    throw new Error(
      "NOT_TRANSFERABLE: Подарок не найден среди доступных к трансферу Unique"
    );
  }

  // Сформируем InputStarGift
  const giftInput =
    chosen.savedId != null
      ? { owner: "me" as const, savedId: chosen.savedId }
      : chosen.messageId != null
      ? { message: chosen.messageId }
      : null;

  if (!giftInput) {
    throw new Error(
      "CANNOT_BUILD_INPUT: Для данного подарка нет savedId и messageId — не можем собрать InputStarGift"
    );
  }

  await tg.findDialogs(toId); // на всякий случай получаем peer
  const svcMsg = await tg.transferStarGift({
    gift: giftInput,
    recipient: toId,
    shouldDispatch: true,
  });

  return {
    ok: true,
    messageId: svcMsg?.id ?? null,
    peerId: toId,
    gift: {
      num: isUniqueGift(chosen.gift) ? chosen.gift.num : null,
      savedId: chosen.savedId != null ? String(chosen.savedId) : null,
      messageId: chosen.messageId ?? null,
    },
  };
}

async function getRandomGift() {
  const { dtos } = await fetchTransferableUniques();
  if (dtos.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * dtos.length);
  return dtos[randomIndex];
}

async function sendUnsended() {
  const spins = await prisma.spin.findMany({
    where: {
      type: "Win",
      nftMode: true,
      nftGiftId: null,
      nftGiftTransferedAt: null,
      gift: {
        isWinNFT: true,
      },
      user: {
        isNot: null,
      },
    },
    include: {
      gift: true,
      user: true,
    },
  });

  for (let s of spins) {
    try {
      await prisma.$transaction(async (tx) => {
        const gift = await getRandomGift();
        if (!gift) return;
        const nftGift = await tx.gift.create({
          data: {
            savedId: gift.savedId ? Number(gift.savedId) : null,
            msgId: gift.messageId ? gift.messageId : null,
            num: gift.num,
            slug: gift.slug,
            title: gift.title,
            isNFT: true,
            isActive: false,
          },
        });
        await tx.spin.update({
          where: {
            id: s.id,
          },
          data: {
            nftGiftId: nftGift.id,
            nftGiftTransferedAt: new Date(),
          },
        });
        await sendGift({
          toId: Number(s.user!.tgId),
          messageId: gift.messageId!,
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  setTimeout(sendUnsended, 5000);
}

const run = async () => {
  await tg.start({
    phone: () => tg.input("Phone Number:"),
    code: () => tg.input("Code:"),
    password: () => tg.input("Password:"),
  });

  sendUnsended();
};

run();
