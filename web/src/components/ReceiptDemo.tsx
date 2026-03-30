import React, { useState } from 'react';
import { IncomeTransaction, Parish, Member, TransactionCategory, PaymentMethod, GenderType } from '../types';
import ReceiptBuilder from './ReceiptBuilder';

// Sample data for demonstration
const sampleTransaction: IncomeTransaction = {
  id: '1',
  transaction_number: 'RCT/2024/001',
  amount: 50000,
  category: TransactionCategory.OFFERTORY,
  payment_method: PaymentMethod.CASH,
  transaction_date: '2024-03-30',
  description: 'Sunday offering',
  parish_id: '1',
  member_id: '1',
  reference_number: 'REF001',
  created_at: '2024-03-30T10:00:00Z',
  updated_at: '2024-03-30T10:00:00Z'
};

const sampleParish: Parish = {
  id: '1',
  parish_name: 'St. Mary\'s Catholic Church',
  parish_code: 'STMARY',
  physical_address: '123 Main Street, Dar es Salaam, Tanzania',
  contact_phone: '+255 22 123 4567',
  contact_email: 'info@stmarys.co.tz',
  diocese_id: '1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const sampleMember: Member = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  member_code: 'MEM001',
  phone_number: '+255 754 123 456',
  physical_address: '456 Oak Avenue, Dar es Salaam',
  email: 'john.doe@email.com',
  gender: GenderType.MALE,
  date_of_birth: '1980-01-01',
  occupation: 'Engineer',
  is_active: true,
  family_id: '1',
  scc_id: '1',
  parish_id: '1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

interface ReceiptDemoProps {
  showFullDemo?: boolean;
}

const ReceiptDemo: React.FC<ReceiptDemoProps> = ({ showFullDemo = false }) => {
  const [showBuilder, setShowBuilder] = useState(false);

  if (showFullDemo) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧾 Custom Receipt System Demo
            </h1>
            <p className="text-gray-600">
              Experience the fully customizable receipt builder with extensive configuration options.
            </p>
          </div>

          <ReceiptBuilder
            transaction={sampleTransaction}
            parish={sampleParish}
            member={sampleMember}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">🧾 Custom Receipt Builder</h3>
        <p className="text-gray-600 mb-6">
          Create professional, fully customizable receipts with our advanced receipt builder.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📐 Flexible Layout</h4>
            <p className="text-sm text-blue-700">
              Choose from thermal 58mm, 80mm, or A4 formats with customizable margins and alignment
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">🎨 Typography Control</h4>
            <p className="text-sm text-green-700">
              Customize fonts, sizes, colors, and spacing for perfect visual hierarchy
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">⚙️ Content Options</h4>
            <p className="text-sm text-purple-700">
              Toggle elements, add custom text, QR codes, and signature lines
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBuilder(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Launch Receipt Builder
        </button>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Custom Receipt Builder</h3>
              <button
                onClick={() => setShowBuilder(false)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <ReceiptBuilder
                transaction={sampleTransaction}
                parish={sampleParish}
                member={sampleMember}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptDemo;
