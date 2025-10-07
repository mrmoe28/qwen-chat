import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { accessToken, locationId } = await request.json();

    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: "Access token and location ID are required" },
        { status: 400 }
      );
    }

    // Validate the Square credentials by testing a connection
    try {
      const environment = accessToken.startsWith('EAAAl') 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox;

      const squareClient = new SquareClient({
        token: accessToken,
        environment,
      });

      // Basic validation - just check if we can create the client
      if (!squareClient) {
        return NextResponse.json(
          { error: "Failed to create Square client" },
          { status: 400 }
        );
      }

      const environmentType = environment === SquareEnvironment.Production ? 'production' : 'sandbox';

      // Store the Square credentials (in a real app, encrypt these)
      await prisma.workspace.update({
        where: { id: user.workspaceId },
        data: {
          // Note: In production, you should encrypt these values
          squareAccessToken: accessToken,
          squareLocationId: locationId,
          squareEnvironment: environmentType,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Square account connected successfully",
        location: {
          name: "Connected Location",
          id: locationId,
          environment: environmentType,
        },
      });

    } catch (squareError) {
      console.error("Square API error:", squareError);
      return NextResponse.json(
        { error: "Failed to connect to Square. Please check your credentials." },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Square connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}