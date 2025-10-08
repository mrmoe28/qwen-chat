import { prisma } from "@/lib/prisma";

export type UpdateUserProfileData = {
  name: string;
  email: string;
  imageUrl?: string;
};

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      imageUrl: data.imageUrl,
    },
  });
}

export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}