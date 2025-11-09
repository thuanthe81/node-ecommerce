import { Metadata } from 'next';
import AnalyticsDashboardContent from './AnalyticsDashboardContent';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Admin',
  description: 'View analytics and sales performance',
};

export default function AnalyticsDashboardPage() {
  return <AnalyticsDashboardContent />;
}
