import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { updateProfileSettingsAction } from "./actions";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile Settings</CardTitle>
          <CardDescription>
            Manage your personal account information and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm user={user} onSave={updateProfileSettingsAction} />
        </CardContent>
      </Card>
    </div>
  );
}