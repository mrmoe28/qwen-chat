import { Client, Environment } from 'square';

let squareClient: Client | null = null;

export function getSquareClient(): Client | null {
  if (!squareClient) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;
    const applicationId = process.env.SQUARE_APPLICATION_ID;

    if (!accessToken || !applicationId) {
      console.warn('Square configuration missing - check SQUARE_ACCESS_TOKEN and SQUARE_APPLICATION_ID');
      return null;
    }

    const env = environment === 'production' ? Environment.Production : Environment.Sandbox;
    
    squareClient = new Client({
      accessToken,
      environment: env,
      applicationId,
    });
  }

  return squareClient;
}

export function getSquareLocationId(): string | null {
  return process.env.SQUARE_LOCATION_ID || null;
}