import { MyContext, MyConversation } from "@/types/MyContext";
import { Keyboard, InlineKeyboard } from "grammy";
import escapeHTML from "escape-html";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";

// Пример конкретной анкеты регистрации
interface Form {
  value?: number;
}

export class Conversation extends ConversationFlow<Form> {
  protected steps() {
    return [
      this.askBalance.bind(this),
      // this.askEmail.bind(this),
    ];
  }

  protected async onFinish() {
    const userId = await this.conversation.external((c) => c.session.userId);
    await prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        balance: this.form.value,
      },
    });
    await this.reply(`✅ Баланс обновлён`, {
      reply_markup: new InlineKeyboard().text(
        this.ctx.t("back"),
        `admin:user:${userId}`
      ),
    });
  }

  private async askBalance() {
    await this.reply(`💰 Введите новый баланс`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    const value = Number(msg.message.text);

    if (isNaN(value)) {
      await this.recall(this.askBalance);
      return;
    }
    this.form.value = value;
  }

  protected cancelCb = async () => {
    const userId = await this.conversation.external(c => c.session.userId);

    return `admin:user:${userId}`;
  }

}

// Экспорт для conversations
export default {
  name: "admin:user:edit:balance",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new Conversation(conversation, ctx, {});
    await flow.start();
  },
};
