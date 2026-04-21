import { HomePageClient } from "@/components/home-page-client";
import { getDashboardData } from "@/lib/api";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return <HomePageClient initialDashboard={dashboard} />;
}
