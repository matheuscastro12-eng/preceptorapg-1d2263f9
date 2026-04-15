import { Download } from "lucide-react";

interface Props {
  data: Record<string, any>[];
  filename: string;
  /** Map opcional de chaves do row -> label no CSV. Se nao passar, usa as keys do primeiro item. */
  headers?: Record<string, string>;
  /** Funcao opcional pra transformar cada row antes de exportar (ex: formatar centavos -> reais) */
  transform?: (row: Record<string, any>) => Record<string, any>;
  label?: string;
  className?: string;
}

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export default function ExportButton({
  data,
  filename,
  headers,
  transform,
  label = "Exportar CSV",
  className = "",
}: Props) {
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const rows = transform ? data.map(transform) : data;
    const keys = headers ? Object.keys(headers) : Object.keys(rows[0]);
    const labels = headers ? Object.values(headers) : keys;

    const csvLines = [
      labels.map(escapeCsv).join(","),
      ...rows.map((r) => keys.map((k) => escapeCsv(r[k])).join(",")),
    ];
    const csv = "\uFEFF" + csvLines.join("\n"); // BOM para Excel abrir com acentos

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().split("T")[0];
    a.download = `${filename}-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      title={data.length === 0 ? "Sem dados pra exportar" : `Exportar ${data.length} linhas`}
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
