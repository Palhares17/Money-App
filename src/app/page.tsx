import DashboardRoot from '@/components/pages/dashboard';

export default function Home() {
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  return <DashboardRoot initialMonth={currentMonth} initialYear={currentYear} />;
}
