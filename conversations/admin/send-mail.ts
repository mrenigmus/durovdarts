import { MyContext, MyConversation } from "@/types/MyContext";
import { Keyboard, InlineKeyboard } from "grammy";
import escapeHTML from "escape-html";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";
import { fork } from "child_process";
import path from "path";

// Пример конкретной анкеты регистрации
interface Form {
  message?: any;
}

export class SendMailConversation extends ConversationFlow<Form> {
  protected cancelCb = "admin";

  protected steps() {
    return [
      this.askMessage.bind(this),
      // this.askEmail.bind(this),
    ];
  }

  protected async onFinish() {
    await this.conversation.external(async () => {
      const child = fork(path.join(__dirname, "../../workers/send-mail.ts"), [], {
        execArgv: ["-r", "ts-node/register"],
        env: {
          ...process.env,
          CHAT_ID: this.ctx.chat!.id.toString(),
          MESSAGE_CHAT_ID: this.form.message.chat!.id.toString(),
          MESSAGE_ID: this.form.message.message_id.toString(),
        },
      });

      child.on("message", () => {
        child.kill();
      });

      child.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Рассылка завершилась с кодом: ${code}`);
        }
      });
    });
  }

  private async askMessage() {
    await this.reply(`Отправьте сообщение для рассылки`, {
      reply_markup: new InlineKeyboard().text("Отменить", "cancel"),
    });
    const msg = await this.waitFor("message");

    this.form.message = msg.message;
  }
}

// Экспорт для conversations
export default {
  name: "admin:mail",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new SendMailConversation(conversation, ctx, {});
    await flow.start();
  },
};
