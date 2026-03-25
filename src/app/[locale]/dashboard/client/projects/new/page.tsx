import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSkillTags } from "@/lib/actions/profile";
import { ProjectForm } from "@/components/project/project-form";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const skills = await getSkillTags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Post a New Project</h1>
      <ProjectForm skills={skills} />
    </div>
  );
}
