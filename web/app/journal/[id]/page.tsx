import { EntryDetailPage } from "@/components/entry-detail-page";

export default function JournalEntryPage({ params }: { params: { id: string } }) {
  return <EntryDetailPage entryId={params.id} />;
}
