import { MyContext, MyConversation } from "@/types/MyContext";
import { Keyboard, InlineKeyboard } from "grammy";
import escapeHTML from "escape-html";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";

// Пример конкретной анкеты регистрации
interface Form {
  name?: string;
  age?: number;
}

export class TestConversation extends ConversationFlow<Form> {
  protected steps() {
    return [
      this.askName.bind(this),
      this.askAge.bind(this),
      // this.askEmail.bind(this),
    ];
  }

  protected async onFinish() {
    await this.reply(
      this.ctx.t("test.success", {
        name: this.form.name!,
        age:
          this.form.age !== undefined
            ? this.form.age.toString()
            : this.ctx.t("not-specified"),
      }),
      {
        reply_markup: new InlineKeyboard().text(
          this.ctx.t("main-menu"),
          "start"
        ),
      }
    );
  }

  private async askName() {
    await this.reply(this.ctx.t("test.ask-name"), {
      reply_markup: this.ctx.from?.first_name
        ? new Keyboard().text(this.ctx.from.first_name).resized().oneTime()
        : undefined,
    });
    const msg = await this.conversation.waitFor("message:text");
    const name = msg.message.text.trim();
    if (!name || name.length < 2 || name.length > 50) {
      await this.recall(this.askName);
      return;
    }
    this.form.name = escapeHTML(msg.message.text!.trim());
    if (!this.form.name) {
      await this.recall(this.askName);
      return;
    }
  }

  private async askAge() {
    await this.reply(this.ctx.t("test.ask-age"), {
      reply_markup: new Keyboard().text(this.ctx.t("skip")).resized().oneTime(),
    });
    const msg = await this.conversation.waitFor("message:text");

    const input = msg.message.text.trim();
    if (input.toLowerCase() === this.ctx.t("skip").toLowerCase()) {
      this.form.age = undefined;
      return;
    }
    const age = parseInt(input, 10);
    if (isNaN(age) || age < 0 || age > 120) {
      await this.recall(this.askAge);
      return;
    }
    this.form.age = age;
  }
}

// Экспорт для conversations
export default {
  name: "test",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new TestConversation(conversation, ctx, {});
    await flow.start();
  },
};
