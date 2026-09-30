import type { ReactNode } from 'react';
import { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { Sidebar } from './Sidebar';

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  return <div className="admin-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="admin-main"><AdminHeader onMenu={() => setOpen(true)} /><div className="admin-content">{children}</div></div></div>;
}
