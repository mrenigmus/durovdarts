import { Bot, User } from "@/generated/prisma";
import { Context, SessionFlavor } from "grammy";
import { I18n, I18nFlavor } from "@grammyjs/i18n";

import { Conversation, ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {
  [key: string]: any;
}

export type MyContext = ConversationFlavor<Context> &
  SessionFlavor<SessionData> &
  I18nFlavor & {
    user: User;
    bot: Bot;
  };

export type MyConversation = Conversation<MyContext, MyContext>;
