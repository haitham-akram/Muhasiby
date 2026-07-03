import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProviderDetailsClient from "@/components/ProviderDetailsClient";
import { prisma } from "@/lib/prisma";

export default async function ProviderDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });

  return <ProviderDetailsClient providerId={params.id} initialProducts={products} />;
}
