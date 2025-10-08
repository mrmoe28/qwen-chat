"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/icons";

export function UserDropdown() {
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name;
  const userEmail = user?.email;
  const workspaceName = session?.user?.workspaceName;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-muted/50 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl || undefined} alt={userName || "User"} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left text-xs">
            <span className="font-medium text-foreground">{workspaceName}</span>
            <span className="text-muted-foreground">{userName || userEmail}</span>
          </div>
          <Icon name="arrowRight" className="h-3 w-3 text-muted-foreground rotate-90" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            <p className="text-xs leading-none text-muted-foreground">{workspaceName}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex items-center gap-2">
            <Icon name="user" className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Icon name="settings" className="h-4 w-4" />
            Company Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings#square-setup" className="flex items-center gap-2">
            <Icon name="creditCard" className="h-4 w-4" />
            Payment Setup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/invoices/new" className="flex items-center gap-2">
            <Icon name="plus" className="h-4 w-4" />
            New Invoice
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <Icon name="logout" className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}