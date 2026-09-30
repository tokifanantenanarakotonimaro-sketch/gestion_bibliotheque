import type { ReactNode } from 'react';

type PageTitleProps = {
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
