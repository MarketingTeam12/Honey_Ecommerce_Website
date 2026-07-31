import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/app/components/ui/skeleton';

function HomeScreenSkeleton() {
  return (
    <div className="min-h-[70vh] bg-white" aria-hidden="true">
      <section className="relative flex min-h-[calc(100vh-150px)] items-start overflow-hidden rounded-t-[22px] border-t-4 border-[#2d96d8] bg-gradient-to-b from-[#c7dbea] via-[#bdd4e6] to-[#b4cde0] pt-3 pb-6 sm:min-h-[calc(100vh-120px)] lg:pb-7">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[24%] right-[5%] h-16 w-64 rounded-md bg-[#0a1247]/[0.035]" />
          <div className="absolute bottom-[18%] left-[5%] h-12 w-72 rounded-md bg-[#0a1247]/[0.035]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1500px] px-3 sm:px-4 lg:px-6">
          <div className="mx-auto flex max-w-[1160px] flex-col items-center text-center">
            <div className="mb-2 w-full space-y-2 lg:mb-4 lg:space-y-3">
              <Skeleton className="mx-auto h-8 w-[360px] max-w-[82vw] rounded-md bg-white/65 sm:h-10 lg:h-12" />
              <Skeleton className="mx-auto h-6 w-[820px] max-w-[92vw] rounded-md bg-white/55 sm:h-8 lg:h-9" />
              <Skeleton className="mx-auto h-[3px] w-[125px] rounded-full bg-[#0a1247]/45 sm:w-[175px]" />
              <Skeleton className="mx-auto h-5 w-[760px] max-w-[88vw] rounded-md bg-white/50 sm:h-6" />
            </div>

            <div className="relative mt-1 w-full sm:mt-2 lg:mt-2.5">
              <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-r from-white/50 via-[#cce2f2]/30 to-white/50 blur-xl" />
              <div className="relative mx-auto flex max-w-[96vw] items-stretch justify-between gap-2.5 sm:max-w-[90vw] lg:max-w-[90vw] lg:gap-3.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative min-w-0 flex-1 aspect-[3/4] overflow-hidden rounded-2xl border-[2.5px] border-[#6f88a3] bg-white/75 shadow-lg"
                  >
                    <Skeleton className="h-full w-full rounded-none bg-white/62" />
                    <Skeleton className="absolute left-[1%] top-[1%] h-[9.5%] w-[18%] rounded-md bg-white/85" />
                    <Skeleton className="absolute left-[2%] top-[2%] h-7 w-7 rounded-full bg-[#d9e1ea] sm:h-8 sm:w-8" />
                    <div className="absolute left-[14%] top-[10%] hidden w-[70%] space-y-2 sm:block">
                      {Array.from({ length: index === 1 ? 8 : 5 }).map((__, lineIndex) => (
                        <Skeleton key={lineIndex} className="h-2.5 rounded-sm bg-[#dce3eb]" />
                      ))}
                    </div>
                    {index === 2 && (
                      <Skeleton className="absolute right-[4%] top-[10%] h-14 w-14 rounded-full bg-[#47c86f]/35 sm:h-20 sm:w-20" />
                    )}
                    <Skeleton className="absolute bottom-[9%] left-[24%] h-14 w-[52%] rotate-[-18deg] rounded-md bg-[#b8c7e6]/70 sm:h-16" />
                  </div>
                ))}
              </div>

              <div className="mt-4 w-full overflow-hidden border-t border-[#2d96d8]/40 pt-3 sm:mt-5">
                <div className="flex gap-6 sm:gap-8">
                  {Array.from({ length: 13 }).map((_, index) => (
                    <Skeleton key={index} className="h-7 w-10 shrink-0 rounded-sm bg-white/55" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/85 to-transparent" />
      </section>
    </div>
  );
}

function ProductScreenSkeleton() {
  return (
    <div className="min-h-[70vh] bg-white px-4 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-4 w-40 bg-gray-200" />
          <Skeleton className="h-10 w-full max-w-xl bg-gray-200" />
          <Skeleton className="h-5 w-full max-w-2xl bg-gray-100" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr]">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg bg-gray-100" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-md bg-gray-100" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4 bg-gray-200" />
              <Skeleton className="h-5 w-32 bg-gray-100" />
              <Skeleton className="h-10 w-44 bg-gray-200" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-md bg-gray-100" />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 rounded-md bg-gray-200" />
              <Skeleton className="h-12 rounded-md bg-gray-100" />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListingScreenSkeleton() {
  return (
    <div className="min-h-[70vh] bg-white px-4 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-36 bg-gray-200" />
            <Skeleton className="h-10 w-72 max-w-full bg-gray-200" />
            <Skeleton className="h-5 w-96 max-w-full bg-gray-100" />
          </div>
          <Skeleton className="h-11 w-48 rounded-md bg-gray-100" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
              <Skeleton className="aspect-[4/3] rounded-md bg-gray-100" />
              <Skeleton className="h-5 w-5/6 bg-gray-200" />
              <Skeleton className="h-4 w-2/3 bg-gray-100" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-24 bg-gray-200" />
                <Skeleton className="h-9 w-24 rounded-md bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactScreenSkeleton() {
  return (
    <div className="min-h-[70vh] bg-white px-4 py-10 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-64 max-w-full bg-gray-200" />
          <Skeleton className="mx-auto h-16 w-[420px] max-w-full rounded-lg bg-gray-100" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5 rounded-lg border border-gray-100 p-5">
            <Skeleton className="h-7 w-48 bg-gray-200" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28 bg-gray-100" />
                <Skeleton className="h-12 w-full rounded-md bg-gray-100" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-md bg-gray-200" />
          </div>

          <div className="space-y-5">
            <Skeleton className="h-52 rounded-lg bg-gray-100" />
            <Skeleton className="h-36 rounded-lg bg-gray-100" />
            <Skeleton className="h-32 rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentScreenSkeleton() {
  return (
    <div className="min-h-[70vh] bg-white px-4 py-10 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-4 w-36 bg-gray-200" />
        <Skeleton className="h-10 w-2/3 max-w-full bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-full bg-gray-100" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PublicPageSkeleton() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.toLowerCase();

  if (normalizedPath === '/') {
    return <HomeScreenSkeleton />;
  }

  if (
    normalizedPath.startsWith('/product/') ||
    normalizedPath.startsWith('/direct-product/') ||
    normalizedPath.startsWith('/sworn-translation/') ||
    normalizedPath.endsWith('-attestation') ||
    normalizedPath.endsWith('-package') ||
    normalizedPath.includes('-language')
  ) {
    return <ProductScreenSkeleton />;
  }

  if (
    normalizedPath.includes('products') ||
    normalizedPath === '/language' ||
    normalizedPath === '/attestation' ||
    normalizedPath === '/apostille' ||
    normalizedPath === '/startup' ||
    normalizedPath.includes('translations-listing')
  ) {
    return <ListingScreenSkeleton />;
  }

  if (normalizedPath.includes('contact')) {
    return <ContactScreenSkeleton />;
  }

  return <ContentScreenSkeleton />;
}

export function AdminPageSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50" aria-hidden="true">
      <aside className="hidden w-64 shrink-0 bg-[#1a1f2e] p-4 lg:block">
        <Skeleton className="mb-8 h-10 w-36 bg-white/15" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-md bg-white/10" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-56 bg-gray-200" />
            <Skeleton className="h-4 w-80 max-w-full bg-gray-200" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg bg-gray-200" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 rounded-lg bg-gray-200" />
      </main>
    </div>
  );
}
