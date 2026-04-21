import { SeeingRecordDetailClient } from "@/components/seeing-record-detail-client";

type SeeingRecordPageProps = {
  params: {
    id: string;
  };
};

export default function SeeingRecordPage({ params }: SeeingRecordPageProps) {
  return <SeeingRecordDetailClient rowId={params.id} />;
}
