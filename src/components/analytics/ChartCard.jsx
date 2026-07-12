import { Loader2 } from 'lucide-react';

export const CHART_COLORS = ['#0A3D8F', '#0891B2', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'];

export default function ChartCard({ title, subtitle, loading, children, height = 250, className = '' }) {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}