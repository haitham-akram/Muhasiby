import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProviderDetailsClient from "@/components/ProviderDetailsClient";

export default async function ProviderDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <ProviderDetailsClient providerId={params.id} />;
}
