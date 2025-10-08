"use server";

import { getCurrentUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/services/user-service";
import { revalidatePath } from "next/cache";

export type UpdateProfileData = {
  name: string;
  email: string;
  imageUrl?: string;
};

export async function updateProfileSettingsAction(data: UpdateProfileData) {
  const user = await getCurrentUser();
  
  try {
    await updateUserProfile(user.id, data);
    revalidatePath("/settings/profile");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile settings");
  }
}