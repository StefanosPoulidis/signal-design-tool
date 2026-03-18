import type { ConditionResult } from '../../lib/types';

interface ConditionBadgeProps {
  label: string;
  result: ConditionResult;
  description?: string;
}

export function ConditionBadge({ label, result, description }: ConditionBadgeProps) {
  const { holds, lhs, rhs, gap } = result;

  return (
    <div className={`rounded-lg p-4 border-2 ${
      holds
        ? 'bg-danger-bg border-danger/30'
        : 'bg-safe-bg border-safe/30'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
          holds ? 'bg-danger' : 'bg-safe'
        }`}>
          {holds ? '!' : '✓'}
        </span>
        <span className="font-semibold text-gray-900">{label}</span>
      </div>

      <div className="font-mono text-sm mb-2">
        <span className="text-primary-700">{lhs.toFixed(4)}</span>
        <span className="mx-2 text-gray-500">{holds ? '>' : '≤'}</span>
        <span className="text-gray-700">{rhs.toFixed(4)}</span>
      </div>

      <div className={`text-sm font-medium ${holds ? 'text-danger' : 'text-safe'}`}>
        {holds
          ? `Harmful signaling pervades (gap: ${gap.toFixed(4)})`
          : `Safe to signal (margin: ${Math.abs(gap).toFixed(4)})`
        }
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
}
