import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

async function resolveWorkspaceMeta(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        defaultWorkspace: {
          select: { id: true, name: true },
        },
        memberships: {
          select: {
            workspace: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    const workspace = user.defaultWorkspace ?? user.memberships[0]?.workspace;
    if (!workspace) {
      return null;
    }

    if (!user.defaultWorkspaceId) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultWorkspaceId: workspace.id },
      });
    }

    return workspace;
  } catch (error) {
    console.error("Error resolving workspace metadata:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        try {
          await resend.emails.send({
            from: provider.from!,
            to: identifier,
            subject: "Sign in to Ledgerflow",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Sign in to Ledgerflow</h1>
                <p>Click the button below to sign in to your account:</p>
                <a href="${url}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Sign In</a>
                <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.</p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials.password) {
            return null;
          }

          const email = credentials.email.toLowerCase();
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) {
            return null;
          }

          const isValid = await compare(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
          const workspace = await resolveWorkspaceMeta(user.id);
          if (workspace) {
            token.workspaceId = workspace.id;
            token.workspaceName = workspace.name;
          }
        } else if (token.sub && !token.workspaceId) {
          const workspace = await resolveWorkspaceMeta(token.sub);
          if (workspace) {
            token.workspaceId = workspace.id;
            token.workspaceName = workspace.name;
          }
        }

        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token.sub) {
          session.user.id = token.sub;
          session.user.email = token.email as string | undefined;
          session.user.name = token.name as string | undefined;
          if (token.workspaceId) {
            session.user.workspaceId = token.workspaceId as string;
            session.user.workspaceName = token.workspaceName as string | undefined;
          }
        }

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
};
