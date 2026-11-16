import AppNavbar from "@/components/AppNavbar";
import { useCallback, useState } from "react";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";

const REPORT_TYPES = [
  { value: "users", label: "User registrations" },
  { value: "recipes", label: "Recipe catalogue" },
  { value: "mealPlans", label: "Meal plans" },
  { value: "orders", label: "Orders" },
  { value: "groceryLists", label: "Grocery lists" },
  { value: "nutrition", label: "Nutrition logs" },
  { value: "reviews", label: "Recipe reviews" },
  { value: "products", label: "Store products" },
];

function cellValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(cellValue).join("; ");
  if (typeof value === "object") {
    if (value._id && Object.keys(value).length <= 3) return value.name || value.email || String(value._id);
    return Object.entries(value).map(([key, item]) => `${key}: ${cellValue(item)}`).join(" | ");
  }
  return String(value);
}

function csvEscape(value) {
  const text = cellValue(value).replace(/^[=+@-]/, "'$&");
  return `"${text.replace(/"/g, '""')}"`;
}

function flattenRow(row) {
  const result = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key === "_id" || key === "__v") return;
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedKey !== "_id" && nestedKey !== "__v") result[`${key}_${nestedKey}`] = nestedValue;
      });
    } else result[key] = value;
  });
  return result;
}

export default function AdminReports() {
  const [type, setType] = useState("users");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in again.");
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/admin/reports/${type}${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Report generation failed.");
      setReport(data);
    } catch (err) {
      setError(err.message || "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  }, [type, from, to]);

  const downloadCsv = () => {
    if (!report?.rows?.length) return;
    const rows = report.rows.map(flattenRow);
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mealmate-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] dark:bg-slate-950">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administration</p>
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-1">Reports & Exports</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Generate operational reports from real MealMate records, filter by date and export them for review.</p>
        </header>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Report type
              <select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                {REPORT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">From date
              <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3" />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">To date
              <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3" />
            </label>
            <button type="button" onClick={generate} disabled={loading || (from && to && from > to)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {loading ? "Generating…" : "Generate report"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Reports are limited to the latest 5,000 matching records. Date filters use record creation date.</p>
        </section>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {report && <>
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-5">
            <div>
              <h2 className="font-black text-xl text-gray-900 dark:text-slate-100">{report.report.title} report</h2>
              <p className="text-sm text-gray-500 mt-1">{report.report.rowCount.toLocaleString()} records · Generated {new Date(report.report.generatedAt).toLocaleString()}</p>
              {report.report.truncated && <p className="text-xs text-amber-600 mt-1">Showing the latest 5,000 records. Narrow the date range for a smaller report.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadCsv} disabled={!report.rows.length} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Download className="h-4 w-4" /> Export CSV</button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200"><Printer className="h-4 w-4" /> Print / Save PDF</button>
            </div>
          </section>
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4"><FileText className="h-5 w-5 text-primary" /><h2 className="font-bold text-gray-900 dark:text-slate-100">Report preview</h2></div>
            {report.rows.length ? <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300"><tr>{Object.keys(flattenRow(report.rows[0])).map((key) => <th key={key} className="px-3 py-3 whitespace-nowrap font-semibold">{key}</th>)}</tr></thead>
                <tbody>{report.rows.slice(0, 100).map((row, index) => { const flat = flattenRow(row); return <tr key={row._id || index} className="border-t border-gray-100 dark:border-slate-800">{Object.keys(flattenRow(report.rows[0])).map((key) => <td key={key} className="px-3 py-3 max-w-[260px] truncate text-gray-700 dark:text-slate-300">{cellValue(flat[key]) || "—"}</td>)}</tr>; })}</tbody>
              </table>
              {report.rows.length > 100 && <p className="text-xs text-gray-400 p-3">Preview shows first 100 rows. CSV export includes all {report.rows.length.toLocaleString()} rows.</p>}
            </div> : <p className="text-sm text-gray-500 py-8 text-center">No records found for this report and date range.</p>}
          </section>
        </>}
      </main>
      <style>{`@media print { header, nav, button, select, input { display: none !important; } main { max-width: none !important; padding: 0 !important; } section { break-inside: avoid; box-shadow: none !important; } body { background: white !important; } }`}</style>
    </div>
  );
}
