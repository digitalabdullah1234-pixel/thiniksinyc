import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProducts } from "@/lib/store";
import { ProductForm } from "../../forms";
import { Back, Head, Shell } from "../../ui";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const product = id === "new" ? undefined : (await getProducts()).find((x) => x.id === id);
  if (id !== "new" && !product) notFound();
  return (
    <Shell section="products" crumb={product ? "Edit" : "New"}>
      <Back href="/?tab=products">Our Products</Back>
      <Head
        kicker={product ? "Edit product" : "New product"}
        title={product ? product.name.en : "New product"}
        note="Every field has an English and an Arabic side; an Arabic field left empty uses the English. Save puts it on the website at once."
      />
      <ProductForm product={product} />
    </Shell>
  );
}
