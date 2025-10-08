import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      isAdmin?: boolean;
      imageUrl?: string | null;
      workspaceId: string;
      workspaceName?: string | null;
    };
  }

  interface User extends DefaultUser {
    isAdmin?: boolean;
    imageUrl?: string | null;
    defaultWorkspaceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    imageUrl?: string | null;
    workspaceId?: string;
    workspaceName?: string;
  }
}
