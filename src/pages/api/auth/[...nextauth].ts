import NextAuth, { AuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        DiscordProvider({
            clientId: String(process.env.DISCORD_CLIENT_ID),
            clientSecret: String(process.env.DISCORD_CLIENT_SECRET),
        }),
    ],
} as AuthOptions

export default NextAuth(authOptions)