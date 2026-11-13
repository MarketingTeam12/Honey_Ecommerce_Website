import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

/**
 * Fallback view for unmatched routes and missing service/product slugs.
 */
export function NotFoundPage({
  title = 'Page not found',
  message = "Sorry, we couldn't find the page or service you're looking for. It may have been moved or does not exist.",
}: NotFoundPageProps) {
  useEffect(() => {
    let robotsMeta = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !robotsMeta;
    const prevContent = robotsMeta?.getAttribute('content') ?? null;

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex');

    return () => {
      if (!robotsMeta) return;
      if (created) {
        robotsMeta.remove();
      } else if (prevContent !== null) {
        robotsMeta.setAttribute('content', prevContent);
      } else {
        robotsMeta.removeAttribute('content');
      }
    };
  }, []);

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1f5c]/10 text-[#1a1f5c] mb-6">
          <FileQuestion className="w-8 h-8" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-2">
          404
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-[#1a1f5c] hover:bg-[#131747] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
