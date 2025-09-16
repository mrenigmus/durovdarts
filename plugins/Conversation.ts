import { Message } from "grammy/types";
import { MyContext, MyConversation } from "@/types/MyContext";
import { InlineKeyboard } from "grammy";
import { TranslationVariables } from "@grammyjs/i18n";

export abstract class ConversationFlow<T> {
  protected ctx: MyContext;
  protected conversation: MyConversation;
  protected form: T;
 protected cancelCb: string | (() => string | Promise<string>) = "start";

  private _restartRequested = false;
  private _gotoStep: number | null = null;
  private _currentStepIndex = 0;
  private _messageIds: number[] = [];

  constructor(conversation: MyConversation, ctx: MyContext, initial: T) {
    this.conversation = conversation;
    this.ctx = ctx;
    this.form = initial;
  }

  // Вызвать из любого шага для перезапуска
  public restart() {
    this._restartRequested = true;
  }

  // Перейти к следующему шагу
  public nextStep() {
    this._gotoStep = this._currentStepIndex + 1;
  }

  // Перейти к предыдущему шагу
  public prevStep() {
    this._gotoStep = Math.max(0, this._currentStepIndex - 1);
  }

  public async reply(
    text: string,
    other?: Parameters<MyContext["reply"]>[1]
  ): Promise<Message.TextMessage> {
    const msg = await this.ctx.reply(text, other);
    await this.collectBotMessage(msg);
    return msg;
  }

  // Сбор message_id
  protected collectBotMessage(msg: any) {
    return this.conversation.external(({ session }) => {
      if (Array.isArray(msg))
        msg.forEach(
          (m) => m?.message_id && session.botMessageIds.push(m.message_id)
        );
      else if (msg?.message_id) session.botMessageIds.push(msg.message_id);
    });
  }

  // Удаление сообщений
  protected async deleteBotMessages() {
    const session = await this.conversation.external((ctx) => ctx.session);

    if (session.botMessageIds.length === 0) return;

    try {
      await this.ctx.api.deleteMessages(
        this.ctx.chat!.id,
        session.botMessageIds
      );
      session.botMessageIds = [];
    } catch (error) {
      console.error("Error deleting bot messages:", error);
    }
  }
  // функция для перевызова определенной функции нужно чтобы перед этим вызывалось удаление сообщения, нужно чтобы в нее передавалась функция в формате this.askName

  protected async recall(
    stepFunction: (...args: any[]) => Promise<void>,
    ...args: any[]
  ): Promise<void> {
    await this.deleteBotMessages();
    await stepFunction.apply(this, args);
  }

  // Основной метод запуска
  async start() {
    const steps = this.steps();
    do {
      this._restartRequested = false;
      this._gotoStep = null;
      this._currentStepIndex = 0;
      while (this._currentStepIndex < steps.length) {
        await this.deleteBotMessages();
        await steps[this._currentStepIndex]();
        if (this._restartRequested) break;
        if (this._gotoStep !== null) {
          this._currentStepIndex = this._gotoStep;
          this._gotoStep = null;
        } else {
          this._currentStepIndex++;
        }
      }
    } while (this._restartRequested);
    await this.deleteBotMessages();
    await this.onFinish();
  }

  // Переопределяется в наследнике: массив функций-шага
  protected abstract steps(): Array<() => Promise<void>>;

  // Переопределяется в наследнике: что делать после всех шагов
  protected abstract onFinish(): Promise<void>;

  // Переопределяется в наследнике: что делать при отмене
  protected onCancel?(): Promise<void> | void;

  protected t(key: string, variables?: TranslationVariables): Promise<string> {
    return this.conversation.external((c) => c.t(key, variables));
  }


  //checkCancel
protected async checkCancel<
  T extends
    | { callbackQuery?: { data: string } }
    | { message?: { text: string } }
>(msg: T) {
  const isCancel =
    ("callbackQuery" in msg && msg.callbackQuery?.data === "cancel") ||
    ("message" in msg &&
      msg.message?.text?.toLowerCase() === "отмена");

  if (!isCancel) return;

  if (this.onCancel) {
    await this.onCancel();
  } else {
    // получаем строку из cancelCb
    let cancelTarget: string;
    if (typeof this.cancelCb === "function") {
      cancelTarget = await this.cancelCb();
    } else {
      cancelTarget = this.cancelCb;
    }

    await this.reply(await this.t("action-canceled"), {
      reply_markup: new InlineKeyboard().text(
        await this.t("back"),
        cancelTarget || "start"
      ),
    });
  }

  throw new Error("cancelled");
}


  //waitFor with checkCancel
  protected async waitFor<
    T extends Parameters<MyConversation["waitFor"]>[0],
    R = Awaited<ReturnType<MyConversation["waitFor"]>>
  >(event: T): Promise<R> {
    //you need to include in waitFor callback query anyways
    const msg = (await this.conversation.waitFor(
      Array.isArray(event)
        ? [...event, "callback_query:data"]
        : [event, "callback_query:data"]
    )) as R;
    await this.checkCancel(msg as any);
    return msg;
  }
}
