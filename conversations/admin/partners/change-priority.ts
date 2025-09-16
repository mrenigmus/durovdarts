import { MyContext, MyConversation } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";

interface Form {
  id?: number;
  priority?: number;
}

export class Conversation extends ConversationFlow<Form> {
  protected steps() {
    return [this.askPriority.bind(this)];
  }

  protected async onFinish() {
    await prisma.partner.update({
      where: { id: this.form.id! },
      data: { priority: this.form.priority! },
    });

    await this.reply(`✅ Приоритет обновлён`, {
      reply_markup: new InlineKeyboard().text(
        this.ctx.t("back"),
        `admin:partner:${this.form.id}`
      ),
    });
  }

  private async askPriority() {
    await this.reply(`⚖️ Введите новый приоритет (0 = низкий, 10 = высокий)`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });

    const msg = await this.waitFor("message:text");
    const val = Number(msg.message.text);
    if (isNaN(val)) {
      await this.reply("❌ Введите корректное число");
      await this.recall(this.askPriority);
      return;
    }
    this.form.priority = val;
  }

  protected cancelCb = "admin:partners";
}

export default {
  name: "admin:partners:priority",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const id = await conversation.external(c => c.session.partnerId);
    const flow = new Conversation(conversation, ctx, { id });
    await flow.start();
  },
};
