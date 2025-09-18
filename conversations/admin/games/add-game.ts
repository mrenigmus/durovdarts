import { MyContext, MyConversation } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";
import { GameType } from "@/generated/prisma";

interface Form {
  count?: number;
  price?: number;
  nftMode?: boolean;
}

export class Conversation extends ConversationFlow<Form> {
  protected steps() {
    return [
      this.askCount.bind(this),
      this.askPrice.bind(this),
      this.askNftMode.bind(this),
    ];
  }

  protected async onFinish() {
    const game = await prisma.game.create({
      data: {
        botId: await this.conversation.external((c) => c.bot.id),
        type: process.env.GAME_TYPE! as GameType,
        count: this.form.count!,
        price: this.form.price!,
        nftMode: this.form.nftMode!,
      },
    });

    await this.reply(`✅ Вариант игры создан`, {
      reply_markup: new InlineKeyboard().text(
        this.ctx.t("back"),
        `admin:game:${game.id}`
      ),
    });
  }

  private async askCount() {
    await this.reply(`🔢 Введите количество`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });

    const msg = await this.waitFor("message:text");
    const value = Number(msg.message.text);

    if (isNaN(value) || value <= 0) {
      await this.reply("❌ Введите корректное число");
      await this.recall(this.askCount);
      return;
    }
    this.form.count = value;
  }

  private async askPrice() {
    await this.reply(`💰 Введите цену`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });

    const msg = await this.waitFor("message:text");
    const value = Number(msg.message.text);

    if (isNaN(value) || value <= 0) {
      await this.reply("❌ Введите корректное число");
      await this.recall(this.askPrice);
      return;
    }
    this.form.price = value;
  }

  private async askNftMode() {
    await this.reply(`🎴 Включить NFT режим?`, {
      reply_markup: new InlineKeyboard()
        .text("✅ Да", "yes")
        .text("❌ Нет", "no"),
    });

    const cb = await this.waitFor("callback_query:data");
    if (cb.callbackQuery.data === "yes") {
      this.form.nftMode = true;
    } else {
      this.form.nftMode = false;
    }
  }

  protected cancelCb = "admin:games";
}

export default {
  name: "admin:games:add",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new Conversation(conversation, ctx, {});
    await flow.start();
  },
};
