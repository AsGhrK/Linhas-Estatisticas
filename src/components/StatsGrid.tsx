import type { StatItem } from '../types/travel';
import './StatsGrid.css';

interface StatsGridProps {
  items: StatItem[];
  columns?: 3 | 4;
  className?: string;
}

export default function StatsGrid({ items, columns = 4, className = '' }: StatsGridProps) {
  return (
    <div className={`stats-grid stats-grid--${columns} ${className}`.trim()}>
      {items.map((item) => (
        <div className="stat" key={`${item.value}-${item.label}`}>
          <div className="stat-number">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
