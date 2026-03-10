import E2EAIDisclosureHarnessClient from './E2EAIDisclosureHarnessClient';

type PageSearchParams = {
  screenplayId?: string | string[];
  title?: string | string[];
};

export default async function E2EAIDisclosureHarnessPage(props: {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
}) {
  const resolvedSearchParams = await Promise.resolve(props.searchParams || {});
  const screenplayIdRaw = resolvedSearchParams.screenplayId;
  const screenplayTitleRaw = resolvedSearchParams.title;
  const screenplayId = Array.isArray(screenplayIdRaw)
    ? (screenplayIdRaw[0] || 'screenplay_e2e_default')
    : (screenplayIdRaw || 'screenplay_e2e_default');
  const screenplayTitle = Array.isArray(screenplayTitleRaw)
    ? (screenplayTitleRaw[0] || 'E2E Screenplay')
    : (screenplayTitleRaw || 'E2E Screenplay');

  // Keep this harness out of production deployments while still available in local/CI test runs.
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        E2E harness is disabled in production.
      </div>
    );
  }

  return <E2EAIDisclosureHarnessClient screenplayId={screenplayId} screenplayTitle={screenplayTitle} />;
}
