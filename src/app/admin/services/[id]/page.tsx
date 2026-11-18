import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getServices } from "@/lib/store";
import { ServiceForm } from "../../forms";
import { Back, Head, Shell } from "../../ui";

export default async function EditService({ params }: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const service = id === "new" ? undefined : (await getServices()).find((x) => x.id === id);
  if (id !== "new" && !service) notFound();
  return (
    <Shell section="services" crumb={service ? "Edit" : "New"}>
      <Back href="/?tab=services">Services</Back>
      <Head
        kicker={service ? "Edit service" : "New service"}
        title={service ? service.title.en : "New service"}
        note="Every field has an English and an Arabic side; an Arabic field left empty uses the English. Save puts it on the website at once."
      />
      <ServiceForm service={service} />
    </Shell>
  );
}
