import { MyContext } from "@/types/MyContext";
import { Middleware, Context } from "grammy";

export function collectBotMessagesPlugin(): Middleware<MyContext> {
  return async (ctx, next) => {
      if (ctx.preCheckoutQuery) return next();
    let session = ctx.session;
    if (!Array.isArray(session.botMessageIds)) {
      session.botMessageIds = [];
    }

    // Список методов, которые нужно обернуть
    const methodsToWrap = [
      "reply",
      "replyWithPhoto",
      "replyWithVideo",
      "replyWithAudio",
      "replyWithDocument",
      "replyWithMediaGroup",
      "replyWithLocation",
      "sendMessage",
      "sendPhoto",
      "sendVideo",
      "sendAudio",
      "sendDocument",
      "sendMediaGroup",
      "sendLocation",
    ] as const;

    // Обертка для методов отправки
    const wrapSend = <K extends keyof Context>(method: K) => {
      const original = ctx[method] as Function;
      ctx[method] = (async (...args: any[]) => {
        try {
          const msg = await original.apply(ctx, args);

          // Обработка массива сообщений (например, для медиагрупп)
          if (Array.isArray(msg)) {
            msg.forEach((m: any) => {
              if (m?.message_id) {
                session.botMessageIds.push(m.message_id);
              }
            });
          } 
          // Обработка одиночного сообщения
          else if (msg?.message_id) {
            session.botMessageIds.push(msg.message_id);
          }

          return msg;
        } catch (error) {
          console.error(`Error in wrapped ${String(method)}:`, error);
          throw error;
        }
      }) as any;
    };

    // Оборачиваем все методы из списка
    for (const method of methodsToWrap) {
      if (method in ctx) {
        wrapSend(method as keyof Context);
      }
    }

    await next();
  };
}
