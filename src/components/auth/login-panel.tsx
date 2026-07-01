import { Chrome } from "lucide-react";
import { signInWithGoogleAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPanel() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join FanPitch</CardTitle>
        <CardDescription>Use your Google account to create or open your FanPitch profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit" size="lg">
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
