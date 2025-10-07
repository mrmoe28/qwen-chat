"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";

interface SquareSetupCardProps {
  isConnected: boolean;
  connectionStatus?: string;
}

export function SquareSetupCard({ isConnected, connectionStatus }: SquareSetupCardProps) {
  const [isExpanded, setIsExpanded] = useState(!isConnected);
  const [accessToken, setAccessToken] = useState("");
  const [locationId, setLocationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/square/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, locationId }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to connect Square account");
      }
    } catch {
      alert("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Square Payment Processing
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? "Accept credit card and ACH payments through Square"
                : "Connect your Square account to start accepting payments"
              }
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide" : "Setup"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {!isConnected ? (
            <>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon name="shield" className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Don&apos;t have a Square account?</h4>
                    <p className="text-sm text-blue-700">
                      Sign up for Square to start accepting credit card payments with competitive rates and next-day deposits.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                      asChild
                    >
                      <a 
                        href="https://squareup.com/signup?v=developers&country=US&language=en" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        Create Square Account
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Square Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="EAAAxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your Square Developer Dashboard → Applications → Your App → Credentials
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId">Square Location ID</Label>
                  <Input
                    id="locationId"
                    placeholder="LXXXXXXXXXXXXXXX"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in Square Dashboard → Account & Settings → Locations
                  </p>
                </div>

                <Button 
                  onClick={handleConnect}
                  disabled={!accessToken || !locationId || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Icon name="shield" className="mr-2 h-4 w-4" />
                      Connect Square Account
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-lg bg-gray-50 border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Create a Square Developer account at developer.squareup.com</li>
                  <li>Create a new application in your Square Developer Dashboard</li>
                  <li>Copy your Access Token from the Credentials tab</li>
                  <li>Get your Location ID from your Square main dashboard</li>
                  <li>Paste both values above and click Connect</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Icon name="check" className="h-4 w-4" />
                  <span className="font-medium">Square Connected Successfully</span>
                </div>
                <p className="text-sm text-green-700">
                  Your invoices will now include &ldquo;Pay with Card&rdquo; buttons that redirect to secure Square checkout pages.
                </p>
                {connectionStatus && (
                  <p className="text-xs text-green-600 mt-2">
                    Status: {connectionStatus}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}