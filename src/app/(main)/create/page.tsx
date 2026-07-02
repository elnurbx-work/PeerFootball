import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PostComposer } from "@/components/posts/post-composer";

export default async function CreatePostPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-2xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Create Post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a football update with the main flow.
        </p>
      </div>
      <PostComposer />
    </section>
  );
}
