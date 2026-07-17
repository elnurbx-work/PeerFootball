import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PostComposer } from "@/components/posts/post-composer";
import { createTranslator } from "@/i18n/dictionary";

export default async function CreatePostPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  return (
    <section className="mx-auto grid max-w-2xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">{t("posts.pages.create.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("posts.pages.create.description")}
        </p>
      </div>
      <PostComposer />
    </section>
  );
}
