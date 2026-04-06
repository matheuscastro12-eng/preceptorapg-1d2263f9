import { useState } from "react";
import { DollarSign, Users, Search, Loader2, CreditCard, RefreshCw } from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";
import { useEFSubscriptions, useEFSales, useCancelEFSubscription } from "@/hooks/useEasyflow";

export default function AdminEasyflow() {
  const [searchEmail, setSearchEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [salePage, setSalePage] = useState(1);
  const [subStatusFilter, setSubStatusFilter] = useState("");

  const { data: subsData, isLoading: subsLoading, refetch: refetchSubs } = useEFSubscriptions(activeEmail || undefined, subPage);
  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useEFSales(activeEmail || undefined, salePage);
  const cancelSub = useCancelEFSubscription();

  const subs = subsData?.data?.docs || subsData?.data || subsData?.items || (Array.isArray(subsData) ? subsData : []);
  const sales = salesData?.data?.sales?.docs || salesData?.data || salesData?.items || (Array.isArray(salesData) ? salesData : []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveEmail(searchEmail.trim());
    setSubPage(1);
    setSalePage(1);
  };

  const filteredSubs = subStatusFilter
    ? subs.filter((s: any) => s.status === subStatusFilter)
    : subs;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">EasyFlow</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dados financeiros e gestão de assinaturas</p>
        </div>
        <button onClick={() => { refetchSubs(); refetchSales(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700">
          <RefreshCw className="w-3.5 h-3.5" />Atualizar
        </button>
      </div>

      {/* KPIs from sales data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Vendas" value={salesData?.data?.totalTransactionValue ? (salesData.data.totalTransactionValue / 100) : 0} format="currency" icon={DollarSign} color="green" subtitle="Valor acumulado" />
        <MetricCard title="Nº de Vendas" value={salesData?.data?.sales?.totalDocs ?? 0} icon={CreditCard} color="blue" subtitle="Pedidos" />
        <MetricCard title="Assinaturas" value={subsData?.data?.totalDocs ?? 0} icon={Users} color="gold" subtitle="Total encontradas" />
        <MetricCard title="Comissões" value={salesData?.data?.totalCommissions ? (salesData.data.totalCommissions / 100) : 0} format="currency" icon={DollarSign} color="purple" subtitle="EasyFlow fees" />
      </div>

      {/* Search */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Buscar por email do cliente..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500">
            Buscar
          </button>
          {activeEmail && (
            <button type="button" onClick={() => { setActiveEmail(""); setSearchEmail(""); }}
              className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white">&times; Limpar</button>
          )}
        </form>
        {activeEmail && <p className="text-xs text-gray-500 mt-2">Resultados para: <span className="text-[#C9A84C]">{activeEmail}</span></p>}
      </div>

      {/* Subscriptions */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Assinaturas {activeEmail ? `— ${activeEmail}` : "(todas)"}</h2>
          <div className="flex gap-1">
            {["", "active", "canceled", "expired", "inactive"].map((st) => (
              <button key={st} onClick={() => setSubStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${subStatusFilter === st ? "bg-[#C9A84C] text-gray-900" : "bg-gray-800 text-gray-500 hover:text-white"}`}>
                {st || "Todas"}
              </button>
            ))}
          </div>
        </div>

        {subsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Cliente", "Plano", "Valor", "Método", "Status", "Criado em", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredSubs.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white text-xs font-medium">{sub.customer?.name || sub.name || "—"}</p>
                      <p className="text-[10px] text-gray-500">{sub.customer?.email || "—"}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">{sub.periodicity || "—"}</td>
                    <td className="py-3 px-4 text-white text-xs font-medium">
                      {sub.recurrenceValueInCents ? `R$ ${(sub.recurrenceValueInCents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{sub.paymentMethod || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sub.status === "active" ? "bg-green-900/30 text-green-400" :
                        sub.status === "canceled" ? "bg-red-900/30 text-red-400" :
                        sub.status === "expired" ? "bg-yellow-900/30 text-yellow-400" :
                        "bg-gray-800 text-gray-500"
                      }`}>{sub.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === "active" && (
                        <button onClick={() => { if (confirm("Cancelar esta assinatura?")) cancelSub.mutate(sub.id); }}
                          className="px-2 py-0.5 rounded text-[10px] text-red-400 hover:bg-red-900/20 font-medium">
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSubs.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-xs">
                    {activeEmail ? "Nenhuma assinatura para este email" : "Busque por email para ver assinaturas"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Vendas {activeEmail ? `— ${activeEmail}` : "(todas)"}</h2>
        </div>

        {salesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Cliente", "Produto", "Valor", "Método", "Status", "Data"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white text-xs font-medium">{sale.buyer?.name || "—"}</p>
                      <p className="text-[10px] text-gray-500">{sale.buyer?.email || "—"}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-xs">{sale.items?.[0]?.product?.name || "—"}</td>
                    <td className="py-3 px-4 text-white text-xs font-medium">
                      R$ {((sale.valueInCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{sale.payments?.[0]?.paymentMethod || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sale.status === "paid" ? "bg-green-900/30 text-green-400" :
                        sale.status === "canceled" || sale.status === "refunded" ? "bg-red-900/30 text-red-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>{sale.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-600 text-xs">
                    {activeEmail ? "Nenhuma venda para este email" : "Busque por email para ver vendas"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
