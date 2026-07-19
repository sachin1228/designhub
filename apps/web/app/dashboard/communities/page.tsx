import { MessageSquare } from "lucide-react";

export default function CommunitiesIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="h-16 w-16 rounded-2xl bg-surface-raised flex items-center justify-center">
        <MessageSquare size={28} className="text-foreground-muted" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          Select a community
        </h2>
        <p className="font-body text-sm text-foreground-muted max-w-xs">
          Choose a community from the panel on the left to start chatting with designers who share your city, sector, or interests.
        </p>
      </div>
    </div>
  );
}
