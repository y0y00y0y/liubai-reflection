import { DayDetailPage } from "@/components/day-detail-page";

export default function DayPage({ params }: { params: { date: string } }) {
  return <DayDetailPage date={params.date} />;
}
