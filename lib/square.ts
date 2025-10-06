import { SquareClient, SquareEnvironment } from 'square';

let squareClient: SquareClient | null = null;

export function getSquareClient(): SquareClient | null {
  if (!squareClient) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;
    const applicationId = process.env.SQUARE_APPLICATION_ID;

    if (!accessToken || !applicationId) {
      console.warn('Square configuration missing - check SQUARE_ACCESS_TOKEN and SQUARE_APPLICATION_ID');
      return null;
    }

    const env = environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
    
    squareClient = new SquareClient({
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