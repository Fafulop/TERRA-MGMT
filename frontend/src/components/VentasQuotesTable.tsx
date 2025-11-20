import React from 'react';
import { Quote, QuoteStatusColors, QuoteStatusLabels, CurrencySymbols } from '../types/ventas';

interface VentasQuotesTableProps {
  quotes: Quote[];
  onViewQuote: (quote: Quote) => void;
  onEditQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: number) => void;
  onUpdateStatus: (quoteId: number, status: string) => void;
  isLoading?: boolean;
}

const VentasQuotesTable: React.FC<VentasQuotesTableProps> = ({
  quotes,
  onViewQuote,
  onEditQuote,
  onDeleteQuote,
  onUpdateStatus,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="text-gray-500">Cargando cotizaciones...</div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="text-gray-500">No hay cotizaciones. Crea una nueva para comenzar.</div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'MXN') => {
    const symbol = CurrencySymbols[currency as keyof typeof CurrencySymbols] || '$';
    return `${symbol}${amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Válida Hasta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewQuote(quote)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {quote.quote_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{quote.customer_name}</div>
                  {quote.customer_company && (
                    <div className="text-xs text-gray-500">{quote.customer_company}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      QuoteStatusColors[quote.status]
                    }`}
                  >
                    {QuoteStatusLabels[quote.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(quote.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(quote.valid_until)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatCurrency(quote.total, quote.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.items_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                  {quote.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => onEditQuote(quote)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onUpdateStatus(quote.id, 'SENT')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Enviar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta cotización?')) {
                            onDeleteQuote(quote.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                  {quote.status === 'SENT' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(quote.id, 'ACCEPTED')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => onUpdateStatus(quote.id, 'REJECTED')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {quote.status === 'ACCEPTED' && (
                    <button
                      onClick={() => alert('Conversión a orden próximamente')}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Convertir a Orden
                    </button>
                  )}
                  <button
                    onClick={() => onViewQuote(quote)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentasQuotesTable;
