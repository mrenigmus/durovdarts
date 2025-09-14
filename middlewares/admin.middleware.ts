import { MyContext } from "@/types/MyContext";
import { NextFunction } from "grammy";

export default async (ctx: MyContext, next: NextFunction) => {
    if ( ctx.user.role == "Admin" ) return next();
    return;
}