
'use client';

import React, { useEffect, useState } from 'react';
import { Sale } from '@/context/sales-context';
import { apiRequest } from '@/lib/api';

interface PrintableReceiptProps {
  sale: Sale;
}

interface CompanySettings {
  companyName?: string;
  companyAddress?: string;
  companyCnpj?: string;
  companyPhone?: string;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPaymentMethod = (payment: Sale['payment']) => {
  if (payment.method === 'Crédito' && payment.installments) {
    if (payment.installments > 1) {
      return `${payment.method} (${payment.installments}x)`;
    }
  }
  return payment.method;
};


export function PrintableReceipt({ sale }: PrintableReceiptProps) {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({});
  
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const settings = await apiRequest<any>('settings');
        setCompanySettings({
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyCnpj: settings.companyCnpj,
          companyPhone: settings.companyPhone,
        });
      } catch (error) {
        console.error('Failed to load company settings:', error);
      }
    };
    loadCompanySettings();
  }, []);
  
  // A taxa foi repassada se a soma do subtotal e da taxa for igual ao total pago.
  // Usamos uma pequena tolerância para evitar problemas com arredondamento de ponto flutuante.
  const feesWerePassedToCustomer = Math.abs((sale.subtotal + sale.fees) - sale.total) < 0.01;

  return (
    <div className="p-8 bg-white text-black w-[302px]">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{companySettings.companyName || 'Chronos'}</h1>
        {companySettings.companyAddress && <p className="text-xs">{companySettings.companyAddress}</p>}
        {companySettings.companyCnpj && <p className="text-xs">CNPJ: {companySettings.companyCnpj}</p>}
        {companySettings.companyPhone && <p className="text-xs">Tel: {companySettings.companyPhone}</p>}
      </div>
      <div className="border-t border-b border-dashed border-black py-2 my-2">
        <h2 className="text-center font-bold text-sm">CUPOM NÃO FISCAL</h2>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>CÓDIGO:</span><span>{sale.id}</span></div>
        <div className="flex justify-between"><span>DATA:</span><span>{new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></div>
        <div className="flex justify-between"><span>CLIENTE:</span><span>{sale.client}</span></div>
        <div className="flex justify-between"><span>VENDEDOR:</span><span>{sale.vendedor}</span></div>
      </div>
      <div className="border-t border-dashed border-black mt-2 pt-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left font-semibold pb-1">ITEM</th>
              <th className="text-right font-semibold pb-1">QTD</th>
              <th className="text-right font-semibold pb-1">VL. UN.</th>
              <th className="text-right font-semibold pb-1">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(item => (
              <tr key={item.id}>
                <td className="py-1 align-top">{item.name}</td>
                <td className="text-right py-1 align-top">{item.quantity}</td>
                <td className="text-right py-1 align-top">{formatCurrency(item.price)}</td>
                <td className="text-right py-1 align-top">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1 text-sm">
         <div className="flex justify-between">
           <span>Subtotal:</span>
           <span>{formatCurrency(sale.subtotal)}</span>
         </div>
         {feesWerePassedToCustomer && (
            <div className="flex justify-between">
            <span>Taxas (Acréscimo):</span>
            <span>{formatCurrency(sale.fees)}</span>
            </div>
         )}
         <div className="flex justify-between font-bold text-base">
           <span>TOTAL:</span>
           <span>{formatCurrency(sale.total)}</span>
         </div>
      </div>
       <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1 text-sm">
          <div className="flex justify-between">
           <span>Forma de Pagamento:</span>
           <span>{formatPaymentMethod(sale.payment)}</span>
         </div>
      </div>
      <div className="text-center mt-6 text-xs">
        <p>Obrigado pela sua preferência!</p>
      </div>
    </div>
  );
};

PrintableReceipt.displayName = 'PrintableReceipt';
