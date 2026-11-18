import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getWhy } from "@/lib/store";
import { WhyForm } from "../../forms";
import { Back, Head, Shell } from "../../ui";

export default async function EditWhy({ params }: PageProps<"/admin/why/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const point = id === "new" ? undefined : (await getWhy()).find((x) => x.id === id);
  if (id !== "new" && !point) notFound();
  return (
    <Shell section="why" crumb={point ? "Edit" : "New"}>
      <Back href="/?tab=why">Why us</Back>
      <Head
        kicker={point ? "Edit point" : "New point"}
        title={point ? point.title.en : "New point"}
        note="Every field has an English and an Arabic side; an Arabic field left empty uses the English. Save puts it on the website at once."
      />
      <WhyForm point={point} />
    </Shell>
  );
}
