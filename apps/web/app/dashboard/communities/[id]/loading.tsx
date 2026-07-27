/**
 * Skeleton shown by Next.js while the community page server component resolves.
 * Mirrors CommunityChat layout exactly to prevent layout shift.
 */
export default function CommunityLoading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-pulse">

      {/* ── Header ── */}
      <div className="px-5 pt-4 border-b border-border shrink-0">

        {/* Top row: avatar + name | buttons */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-surface-raised shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3 w-36 rounded bg-surface-raised" />
              <div className="h-2.5 w-20 rounded bg-surface-raised" />
            </div>
          </div>
          {/* Bell + Joined + ··· */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-surface-raised" />
            <div className="h-8 w-20 rounded-lg bg-surface-raised" />
            <div className="h-8 w-8 rounded-lg bg-surface-raised" />
          </div>
        </div>

        {/* Tab nav row */}
        <div className="flex items-center gap-5 pb-0">
          {[28, 20, 24, 28].map((w, i) => (
            <div key={i} className="py-2.5 px-3">
              <div className={`h-3 w-${w} rounded bg-surface-raised`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Messages ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

            {/* Message — other user */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-surface-raised shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 rounded bg-surface-raised" />
                <div className="h-9 w-56 rounded-2xl rounded-tl-sm bg-surface-raised" />
              </div>
            </div>

            {/* Consecutive message — same sender (no avatar) */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="h-9 w-72 rounded-2xl rounded-tl-sm bg-surface-raised" />
            </div>

            {/* Message — current user (right-aligned) */}
            <div className="flex justify-end">
              <div className="h-9 w-44 rounded-2xl rounded-tr-sm bg-surface-raised" />
            </div>

            {/* Message — other user */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-surface-raised shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-20 rounded bg-surface-raised" />
                <div className="h-14 w-60 rounded-2xl rounded-tl-sm bg-surface-raised" />
              </div>
            </div>

            {/* Message — current user, taller */}
            <div className="flex justify-end">
              <div className="h-12 w-52 rounded-2xl rounded-tr-sm bg-surface-raised" />
            </div>

            {/* Message — other user, short */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-surface-raised shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-28 rounded bg-surface-raised" />
                <div className="h-9 w-48 rounded-2xl rounded-tl-sm bg-surface-raised" />
              </div>
            </div>

            {/* Consecutive */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 shrink-0" />
              <div className="h-9 w-64 rounded-2xl rounded-tl-sm bg-surface-raised" />
            </div>

          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 shrink-0">
            <div className="h-[52px] rounded-2xl bg-surface-raised" />
          </div>
        </div>

        {/* ── Info sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Main info card */}
          <div className="border border-border mr-4 mt-4 rounded-xl flex flex-col">

            {/* Members */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-24 rounded bg-surface-raised" />
                <div className="h-2.5 w-14 rounded bg-surface-raised" />
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full bg-surface-raised ring-2 ring-surface shrink-0"
                    style={{ marginLeft: i === 0 ? 0 : -10 }}
                  />
                ))}
              </div>
            </div>

            {/* About */}
            <div className="px-4 py-4 border-b border-border">
              <div className="h-3 w-10 rounded bg-surface-raised mb-3" />
              <div className="space-y-2 mb-3">
                <div className="h-2.5 w-full rounded bg-surface-raised" />
                <div className="h-2.5 w-4/5 rounded bg-surface-raised" />
                <div className="h-2.5 w-3/5 rounded bg-surface-raised" />
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-3 w-3 rounded bg-surface-raised shrink-0" />
                <div className="h-2.5 w-28 rounded bg-surface-raised" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-16 rounded-full bg-surface-raised" />
                <div className="h-5 w-24 rounded-full bg-surface-raised" />
              </div>
            </div>

            {/* Rules */}
            <div className="px-4 py-4">
              <div className="h-3 w-10 rounded bg-surface-raised mb-3" />
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-surface-raised shrink-0 mt-0.5" />
                    <div className={`h-2.5 rounded bg-surface-raised ${i === 0 ? "w-full" : i === 1 ? "w-4/5" : "w-3/5"}`} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Community Stats card */}
          <div className="border border-border mr-4 mb-4 rounded-xl px-4 py-4">
            <div className="h-3 w-28 rounded bg-surface-raised mb-3" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-raised rounded-xl px-3 py-3 flex flex-col gap-1.5 border border-border">
                  <div className="h-4 w-8 rounded bg-surface" />
                  <div className="h-2 w-10 rounded bg-surface" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
