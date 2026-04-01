import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSkillTags } from "@/lib/actions/profile";
import { ProjectForm } from "@/components/project/project-form";
import { Badge } from "@/components/ui/badge";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const skills = await getSkillTags();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <Badge variant="accent" className="mb-4">New Initiative</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">
          Architect Your AI Solution
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Define your technical requirements and connect with elite AI engineers.
        </p>
      </header>

      <ProjectForm skills={skills} />
    </div>
  );
}
