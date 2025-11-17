'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { userApi } from '@/lib/user-api';
import { useAuth } from '@/contexts/AuthContext';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface ShippingAddressFormProps {
  onAddressSelect: (addressId: string) => void;
  onNewAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  selectedAddressId?: string;
}

export default function ShippingAddressForm({
  onAddressSelect,
  onNewAddress,
  selectedAddressId,
}: ShippingAddressFormProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Vietnam',
  });

  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    } else {
      setShowNewAddressForm(true);
    }
  }, [user]);

  const loadSavedAddresses = async () => {
    try {
      setLoading(true);
      const addresses = await userApi.getAddresses();
      setSavedAddresses(addresses);

      // Auto-select default address
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress && !selectedAddressId) {
        onAddressSelect(defaultAddress.id);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNewAddress(formData);
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {user && savedAddresses.length > 0 && !showNewAddressForm && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('checkout.selectShippingAddress')}</h3>
          <div className="space-y-3">
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="shippingAddress"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => onAddressSelect(address.id)}
                  className="mr-3"
                />
                <div className="inline-block">
                  <div className="font-semibold">{address.fullName}</div>
                  <div className="text-sm text-gray-600">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.postalCode}
                  </div>
                  <div className="text-sm text-gray-600">{address.phone}</div>
                  {address.isDefault && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Default
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowNewAddressForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            + {t('checkout.addNewAddress')}
          </button>
        </div>
      )}

      {(showNewAddressForm || !user || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">{t('checkout.shippingAddress')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.fullName')} *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.address')} 1 *</label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('checkout.address')} 2</label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.city')} *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.stateOrProvince')} *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('checkout.postalCode')} *</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {user && savedAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNewAddressForm(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← {t('checkout.backToSavedAddress')}
            </button>
          )}
        </form>
      )}
    </div>
  );
}