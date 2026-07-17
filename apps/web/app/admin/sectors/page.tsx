import { MasterDataPage } from "@/components/admin/MasterDataPage";

export const metadata = { title: "Design Sectors — Admin" };

export default function SectorsPage() {
  return (
    <MasterDataPage
      title="Design Sectors"
      entity="Sector"
      apiBase="/api/admin/sectors"
    />
  );
}
