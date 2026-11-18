import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProjects } from "@/lib/store";
import { ProjectForm } from "../../forms";
import { Back, Head, Shell } from "../../ui";

export default async function EditProject({ params }: PageProps<"/admin/work/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const project = id === "new" ? undefined : (await getProjects()).find((x) => x.id === id);
  if (id !== "new" && !project) notFound();
  return (
    <Shell section="work" crumb={project ? "Edit" : "New"}>
      <Back href="/?tab=work">Our Work</Back>
      <Head
        kicker={project ? "Edit project" : "New project"}
        title={project ? project.title.en : "New project"}
        note="Every field has an English and an Arabic side; an Arabic field left empty uses the English. Save puts it on the website at once."
      />
      <ProjectForm project={project} />
    </Shell>
  );
}
