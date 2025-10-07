import { prisma } from "@/lib/prisma";

export interface SquareConnectionStatus {
  isConnected: boolean;
  locationName?: string;
  environment?: string;
  error?: string;
}

export async function getSquareConnectionStatus(workspaceId: string): Promise<SquareConnectionStatus> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        squareAccessToken: true,
        squareLocationId: true,
        squareEnvironment: true,
      },
    });

    if (!workspace?.squareAccessToken || !workspace?.squareLocationId) {
      return { isConnected: false };
    }

    // Basic validation - if we have both tokens, consider it connected
    return {
      isConnected: true,
      locationName: "Connected Location",
      environment: workspace.squareEnvironment || 'sandbox',
    };
  } catch (error) {
    console.error("Error checking Square connection:", error);
    return {
      isConnected: false,
      error: "Database error",
    };
  }
}