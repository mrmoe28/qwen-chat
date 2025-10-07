import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      isAdmin?: boolean;
      workspaceId: string;
      workspaceName?: string | null;
    };
  }

  interface User extends DefaultUser {
    isAdmin?: boolean;
    defaultWorkspaceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    workspaceId?: string;
    workspaceName?: string;
  }
}
