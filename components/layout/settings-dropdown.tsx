"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

const settingsItems = [
  {
    label: "Company Settings",
    href: "/settings",
    description: "Update company information and branding",
    icon: "settings" as const,
  },
  {
    label: "Payment Setup",
    href: "/settings#square-setup",
    description: "Connect Square for payment processing",
    icon: "creditCard" as const,
  },
  {
    label: "Email Configuration",
    href: "/settings#email-delivery",
    description: "Configure email delivery settings",
    icon: "mail" as const,
  },
];

export function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon name="settings" className="h-4 w-4" />
        Settings
        <Icon name="arrowRight" className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-medium text-foreground border-b border-border mb-2">
              Workspace Settings
            </div>
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <Icon name={item.icon} className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </Link>
            ))}
            
            <div className="border-t border-border mt-2 pt-2">
              <Link
                href="https://squareup.com/signup?v=developers&country=US&language=en"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-blue-50 text-blue-700"
              >
                <Icon name="shield" className="h-4 w-4" />
                <span className="font-medium">Create Square Account</span>
                <Icon name="arrowRight" className="h-3 w-3 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}