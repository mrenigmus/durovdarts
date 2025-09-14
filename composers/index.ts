
import fs from "fs";
import path from "path";
import { Bot } from "grammy";
import { MyContext } from "@/types/MyContext";

export default async (bot: Bot<MyContext>) => {
  const composersDir = path.resolve(__dirname);
  const files = fs
    .readdirSync(composersDir)
    .filter((f) => f !== "index.ts" && f.endsWith(".ts"));

  for (const file of files) {
    const { default: composer } = await import(path.join(composersDir, file));
    bot.use(composer);
  }
};
