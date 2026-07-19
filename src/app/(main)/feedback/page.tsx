import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function FeedbackPage() {
  if (!(await getCurrentUser())) redirect("/auth/login");

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <MessageSquareText className="mb-2 h-7 w-7 text-primary" />
          <CardTitle>Feedback</CardTitle>
          <CardDescription>FanPitch-i yaxşılaşdırmaq üçün problem və təkliflərinizi bizə göndərin.</CardDescription>
        </CardHeader>
        <CardContent><FeedbackForm /></CardContent>
      </Card>
    </section>
  );
}
