import type { ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
};

export function StatCard({ icon, label, value, tone }: StatCardProps) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong></div></div>;
}
