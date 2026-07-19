import { CommunitiesPanel } from "@/components/communities/CommunitiesPanel";

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // -mx-8 -my-8 undoes the px-8 py-8 of the parent <main>
    // h-[calc(100vh-57px)] gives full height minus the sticky topbar (57px)
    <div className="-mx-8 -my-8 flex overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
      <CommunitiesPanel />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
