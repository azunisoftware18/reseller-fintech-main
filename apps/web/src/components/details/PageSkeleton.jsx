"use client";

export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse px-8 py-6">
      {/* BACK BUTTON */}
      <div className="h-8 w-32 bg-muted rounded-md mb-6" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-xl bg-muted" />

          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded-md" />
            <div className="h-4 w-32 bg-muted rounded-md" />
            <div className="flex gap-3">
              <div className="h-4 w-20 bg-muted rounded-md" />
              <div className="h-4 w-20 bg-muted rounded-md" />
            </div>
          </div>
        </div>

        {/* Edit button */}
        <div className="h-10 w-28 bg-muted rounded-md" />
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-border mb-6">
        <div className="h-10 w-24 bg-muted rounded-md" />
        <div className="h-10 w-24 bg-muted rounded-md" />
        <div className="h-10 w-24 bg-muted rounded-md" />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="h-5 w-40 bg-muted rounded-md mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-muted rounded-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded-md" />
                      <div className="h-4 w-32 bg-muted rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="h-5 w-40 bg-muted rounded-md mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-10 bg-muted rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
