import Link from "next/link";
import { LogOut, Trophy, UserCircle } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/feed", label: "Feed" },
  { href: "/profile", label: "Profile" },
  { href: "/teams", label: "Teams" },
  { href: "/matches", label: "Matches" }
];

export async function SiteHeader() {
  const currentUser = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </span>
          FanPitch
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/profile">
                <UserCircle className="h-4 w-4" />
                {currentUser.username ?? "Profile"}
              </Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" size="sm" variant="outline" aria-label="Logout">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
