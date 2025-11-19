import { Metadata } from 'next';
import PaymentSettingsContent from './PaymentSettingsContent';

export const metadata: Metadata = {
  title: 'Payment Settings - Admin',
  description: 'Manage bank transfer payment settings',
};

export default function PaymentSettingsPage() {
  return <PaymentSettingsContent />;
}
