declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      DATABASE_URL: string;
      MODE: "prod" | "dev";
      [key: string]: string;
    }
  }
}

export {};
