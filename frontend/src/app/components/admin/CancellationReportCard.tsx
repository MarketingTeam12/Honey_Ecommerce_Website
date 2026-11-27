import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { type CancellationStats, formatInr, getCancellationStats } from '@/app/services/cancellationApi';

const toSql = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

/** Maps the Reports page date-range dropdown to a from/to window. */
function rangeFor(dateRange: string): { from?: string; to?: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (dateRange) {
    case 'today':
      return { from: toSql(startOfDay) };
    case 'this-week': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - start.getDay());
      return { from: toSql(start) };
    }
    case 'this-month':
      return { from: toSql(new Date(now.getFullYear(), now.getMonth(), 1)) };
    case 'last-month':
      return {
        from: toSql(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toSql(new Date(now.getFullYear(), now.getMonth(), 1)),
      };
    case 'this-year':
      return { from: toSql(new Date(now.getFullYear(), 0, 1)) };
    default:
      return {};
  }
}

/** Cancellations count, total refunded and top reasons for the selected period. */
export function CancellationReportCard({ dateRange }: { dateRange: string }) {
  const [stats, setStats] = useState<CancellationStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    getCancellationStats(rangeFor(dateRange))
      .then((result) => !cancelled && setStats(result.stats))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  if (error || !stats) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <RotateCcw className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cancellations & Refunds</h2>
          <p className="text-sm text-gray-600">For the selected period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-gray-600">Cancellations</p>
          <p className="text-2xl font-bold text-gray-900">{stats.cancellations}</p>
          {stats.pendingRequests > 0 && <p className="text-xs text-amber-700 mt-1">{stats.pendingRequests} awaiting review</p>}
        </div>
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm text-gray-600">Total refunded</p>
          <p className="text-2xl font-bold text-gray-900 break-words">{formatInr(stats.totalRefunded)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.refundsProcessed} refund(s) processed</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600 mb-1">Top reasons</p>
          {stats.topReasons.length === 0 ? (
            <p className="text-sm text-gray-500">No cancellation requests yet</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats.topReasons.map((item) => (
                <li key={item.reason} className="flex justify-between gap-2">
                  <span className="text-gray-800 truncate">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default CancellationReportCard;
