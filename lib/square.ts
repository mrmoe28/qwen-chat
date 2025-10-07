import { SquareClient, SquareEnvironment } from 'square';
import { prisma } from "@/lib/prisma";

const squareClientCache: { [workspaceId: string]: SquareClient } = {};

export async function getSquareClient(workspaceId?: string): Promise<SquareClient | null> {
  // If no workspaceId provided, fall back to environment variables (backward compatibility)
  if (!workspaceId) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;

    if (!accessToken) {
      console.warn('Square configuration missing - check SQUARE_ACCESS_TOKEN');
      return null;
    }

    const env = environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
    
    return new SquareClient({
      token: accessToken,
      environment: env,
    });
  }

  // Use cached client if available
  if (squareClientCache[workspaceId]) {
    return squareClientCache[workspaceId];
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        squareAccessToken: true,
        squareEnvironment: true,
      },
    });

    if (!workspace?.squareAccessToken) {
      return null;
    }

    const environment = workspace.squareEnvironment === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;

    const client = new SquareClient({
      token: workspace.squareAccessToken,
      environment,
    });

    // Cache the client
    squareClientCache[workspaceId] = client;
    return client;
  } catch (error) {
    console.error('Error getting Square client for workspace:', workspaceId, error);
    return null;
  }
}

export async function getSquareLocationId(workspaceId?: string): Promise<string | null> {
  // If no workspaceId provided, fall back to environment variables (backward compatibility)
  if (!workspaceId) {
    return process.env.SQUARE_LOCATION_ID || null;
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { squareLocationId: true },
    });

    return workspace?.squareLocationId || null;
  } catch (error) {
    console.error('Error getting Square location ID for workspace:', workspaceId, error);
    return null;
  }
}

// Backward compatibility - sync version for existing code
export function getSquareClientSync(): SquareClient | null {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENVIRONMENT;

  if (!accessToken) {
    console.warn('Square configuration missing - check SQUARE_ACCESS_TOKEN');
    return null;
  }

  const env = environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
  
  return new SquareClient({
    token: accessToken,
    environment: env,
  });
}

export function getSquareLocationIdSync(): string | null {
  return process.env.SQUARE_LOCATION_ID || null;
}