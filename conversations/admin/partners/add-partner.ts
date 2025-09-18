import { MyContext, MyConversation } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { ConversationFlow } from "@/plugins/Conversation";
import { prisma } from "@/utils/prisma";
import { Api } from "grammy";
import { PartnerType } from "@/generated/prisma";

interface Form {
  title?: string;
  type?: PartnerType;
  channelId?: number;
  botToken?: string;
  url?: string;
  priority?: number;
}

export class Conversation extends ConversationFlow<Form> {
  protected steps() {
    return [
      this.askTitle.bind(this),
      this.askType.bind(this),
      this.askUrl.bind(this),
      this.askPriority.bind(this),
      this.validateAccess.bind(this),
    ];
  }

  protected async onFinish() {
    const partner = await prisma.partner.create({
      data: {
        botId: await this.conversation.external(c => c.bot.id),
        title: this.form.title!,
        type: this.form.type!,
        channelId: this.form.channelId,
        botToken: this.form.botToken,
        url: this.form.url!,
        priority: this.form.priority ?? 0,
      },
    });

    await this.reply(`✅ Партнёр добавлен: ${partner.title}`, {
      reply_markup: new InlineKeyboard().text(
        this.ctx.t("back"),
        "admin:partners"
      ),
    });
  }

  private async askTitle() {
    await this.reply(`📝 Введите название партнёра`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    this.form.title = msg.message.text.trim();
  }

  private async askType() {
    await this.reply(`📌 Выберите тип`, {
      reply_markup: new InlineKeyboard()
        .text("📢 Channel", "Channel")
        .text("🤖 Bot", "Bot"),
    });
    const cb = await this.waitFor("callback_query:data");
    this.form.type = cb.callbackQuery.data as PartnerType;

    if (this.form.type === "Channel") {
      await this.reply(`📡 Введите ID канала (целое число)`, {
        reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
      });
      const msg = await this.waitFor("message:text");
      this.form.channelId = Number(msg.message.text.trim());
    } else if (this.form.type === "Bot") {
      await this.reply(`🔑 Введите токен бота`, {
        reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
      });
      const msg = await this.waitFor("message:text");
      this.form.botToken = msg.message.text.trim();
    }else{
        await this.recall(this.askType);
    }
  }

  private async askUrl() {
    await this.reply(`🌍 Введите ссылку на партнёра (URL)`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    this.form.url = msg.message.text.trim();
  }

  private async askPriority() {
    await this.reply(`⚖️ Введите приоритет (0 = низкий, 10 = высокий)`, {
      reply_markup: new InlineKeyboard().text(this.ctx.t("cancel"), "cancel"),
    });
    const msg = await this.waitFor("message:text");
    const val = Number(msg.message.text);
    this.form.priority = isNaN(val) ? 0 : val;
  }

  private async validateAccess() {
    try {
      if (this.form.type === "Channel" && this.form.channelId) {
        await this.ctx.api.getChatMember(this.form.channelId, this.ctx.me.id);
      } else if (this.form.type === "Bot" && this.form.botToken) {
        const api = new Api(this.form.botToken);
        await api.getMe();
      }
    } catch (e) {
      await this.reply("❌ Ошибка: у бота нет доступа к ресурсу партнёра.");
      await this.recall(this.askType);
    }
  }

  protected cancelCb = "admin:partners";
}

export default {
  name: "admin:partners:add",
  conversation: async (conversation: MyConversation, ctx: MyContext) => {
    const flow = new Conversation(conversation, ctx, {});
    await flow.start();
  },
};
