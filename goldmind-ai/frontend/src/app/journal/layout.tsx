import DashboardShell from '@/components/DashboardShell';

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
