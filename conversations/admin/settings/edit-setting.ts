import { MyContext, MyConversation } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";
import { SettingsType } from "@/generated/prisma";

interface Form {
  key?: string;
  type?: SettingsType;
  value?: string;
}

export class Conversation extends ConversationFlow<Form> {
  protected steps() {
    return [
      this.askKey.bind(this),
      this.askType.bind(this),
      this.askValue.bind(this),
    ];
  }

  protected async onFinish() {
    await prisma.settings.upsert({
      where: { key: this.form.key! },
      update: {
        type: this.form.type!,
        value: this.form.value!,
      },
      create: {
        key: this.form.key!,
        type: this.form.type!,
        value: this.form.value!,
      },
    });

    await this.reply(`✅ Настройка сохранена`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("back"), "admin:settings"),
    });
  }

  private async askKey() {
    await this.reply("🔑 Введите ключ настройки", {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    this.form.key = msg.message.text.trim();
  }

  private async askType() {
    await this.reply("⚙️ Выберите тип", {
      reply_markup: new InlineKeyboard()
        .text("📝 String", "String")
        .text("🔢 Int", "Int")
        .row()
        .text("📊 Float", "Float")
        .text("✅ Boolean", "Boolean")
        .row()
        .text("📦 Json", "Json"),
    });
    const cb = await this.waitFor("callback_query:data");
    this.form.type = cb.callbackQuery.data as SettingsType;
  }

  private async askValue() {
    await this.reply("✏️ Введите значение", {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    this.form.value = msg.message.text.trim();
  }

  protected cancelCb = "admin:settings";
}

export default {
  name: "admin:settings:edit",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new Conversation(conversation, ctx, {});
    await flow.start();
  },
};
