import DashboardShell from '@/components/DashboardShell';

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
