import Link from "next/link";
import { FileText, LayoutDashboard, MessageSquareText, ShieldAlert } from "lucide-react";
import { adminLogoutAction } from "@/actions/admin-auth.actions";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-emerald-400">FanPitch idarəetməsi</p>
        <nav className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800">
            <Link href="/admin"><LayoutDashboard className="h-4 w-4" />Panel</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800">
            <Link href="/admin/feedback"><MessageSquareText className="h-4 w-4" />Feedback</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800">
            <Link href="/admin/posts"><FileText className="h-4 w-4" />Postlar</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800">
            <Link href="/admin/reports"><ShieldAlert className="h-4 w-4" />Reports</Link>
          </Button>
        </nav>
      </div>
      <form action={adminLogoutAction}>
        <Button type="submit" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800">Çıxış</Button>
      </form>
    </header>
  );
}
