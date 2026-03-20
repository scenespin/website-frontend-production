'use client';

/**
 * Shared admin page shell for consistent black-on-black styling.
 * This is additive and can be adopted page-by-page.
 */
export default function AdminShell({ title, subtitle, children, actions = null }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
        {title || subtitle || actions ? (
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-5 md:flex-row md:items-center">
            <div>
              {title ? (
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-sm text-zinc-400 md:text-base">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
