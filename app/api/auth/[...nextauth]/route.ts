import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Session, User as NextAuthUser } from "next-auth"
import { JWT } from "next-auth/jwt"
import { prisma } from '@/lib/db'

type ExtendedSessionUser = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  roles?: string[]
  permissions?: string[]
  sales_rep_id?: string | null
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[AUTH] Missing email or password")
          throw new Error("Missing email or password")
        }
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })
        if (!user) {
          console.error(`[AUTH] User not found for email: ${credentials.email}`)
          throw new Error("User not found")
        }
        if (!user.password) {
          console.error(`[AUTH] No password set for user: ${credentials.email}`)
          throw new Error("No password set for this user")
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          console.error(`[AUTH] Invalid password for user: ${credentials.email}`)
          throw new Error("Invalid password")
        }
        if (user.is_active === false) {
          console.error(`[AUTH] User is not active: ${credentials.email}`)
          throw new Error("User is not active")
        }
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!session.user) session.user = {} as ExtendedSessionUser
      const userObj = session.user as ExtendedSessionUser
      if (token?.sub) {
        const user = await prisma.users.findUnique({
          where: { id: Number(token.sub) },
          include: {
            user_roles_user_roles_user_idTousers: {
              include: {
                roles: true,
              },
            },
          },
        })
        userObj.id = token.sub
        userObj.roles = user?.user_roles_user_roles_user_idTousers.map((ur: any) => ur.roles.name) || []
        userObj.permissions = user?.user_roles_user_roles_user_idTousers.flatMap((ur: any) => ur.roles.permissions || []) || []
        if (user?.email) {
          const salesRep = await prisma.sales_representatives.findUnique({ where: { email: user.email } });
          userObj.sales_rep_id = salesRep ? String(salesRep.id) : null;
        } else {
          userObj.sales_rep_id = null;
        }
      }
      return session
    },
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 
