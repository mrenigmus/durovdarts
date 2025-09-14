import fs from "fs";
import path from "path";
import { Bot } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { MyContext } from "@/types/MyContext";
import { i18n } from "@/plugins/I18n";

function getAllTsFiles(dir: string, exclude: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsFiles(filePath, exclude));
    } else if (file !== exclude && file.endsWith(".ts")) {
      results.push(filePath);
    }
  }
  return results;
}

export default async (bot: Bot<MyContext>) => {
  bot.use(
    conversations<MyContext, MyContext>({
      plugins: [i18n],
    })
  );
  const dir = path.resolve(__dirname);
  const files = getAllTsFiles(dir, "index.ts");

  for (const file of files) {
    const mod = await import(file);
    bot.use(createConversation(mod.default.conversation, mod.default.name));
  }
};
