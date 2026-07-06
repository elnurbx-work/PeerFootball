import Link from "next/link";
import { Home, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="space-y-7">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <WifiOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Offline mode
          </p>
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
            FanPitch is waiting for a connection.
          </h1>
          <p className="text-lg text-muted-foreground">
            Some cached parts of the app may still open, but live football posts,
            teams, friends, and matches need internet access.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href=".">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
