import fs from "fs";
import path from "path";
import { Bot } from "grammy";
import { MyContext } from "@/types/MyContext";

async function loadComposersRecursively(dir: string, bot: Bot<MyContext>) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadComposersRecursively(fullPath, bot);
    } else if (
      entry.isFile() &&
      entry.name !== "index.ts" &&
      entry.name.endsWith(".ts")
    ) {
      const { default: composer } = await import(fullPath);
      bot.use(composer);
    }
  }
}

export default async (bot: Bot<MyContext>) => {
  const composersDir = path.resolve(__dirname);
  await loadComposersRecursively(composersDir, bot);
};
