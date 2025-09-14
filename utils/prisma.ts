import { PrismaClient } from "@/generated/prisma";
import { pagination } from "prisma-extension-pagination";

export const prisma = new PrismaClient({
  log: [
    // "query", 
    "info", "warn", "error"],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000
    }
}).$extends(pagination());
