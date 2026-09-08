import React, { useState, useEffect } from "react";
import { X, Database, Code, Server, Copy, Check, Terminal, Layers, Download, FileText } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

interface DatabaseSchemaViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"nodejs" | "erd" | "mysql" | "api">("nodejs");
  const [schemaData, setSchemaData] = useState<{
    runtime?: string;
    tables: string[];
    nodeJsCode?: string;
    mysqlSchema: string;
    phpPdoCode?: string;
    restEndpoints: { method: string; path: string; description: string }[];
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !schemaData) {
      api.system.getSchemaDocs().then((data: any) => setSchemaData(data));
    }
  }, [isOpen, schemaData]);

  if (!isOpen) return null;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast("Code copied to clipboard!", "info");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Full-Stack Architecture &amp; Node.js API</h2>
              <p className="text-xs text-zinc-400">React 19 + TypeScript + Node.js (Express REST API) + Port 3000</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("nodejs")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "nodejs"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Node.js (Express Server)</span>
            </button>
            <button
              onClick={() => setActiveTab("erd")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "erd"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Database Relational ERD</span>
            </button>
            <button
              onClick={() => setActiveTab("mysql")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "mysql"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL Database DDL</span>
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "api"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>REST API Endpoints</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "mysql" && (
              <a
                href="/api/system/download-sql"
                download="shopeazy_db.sql"
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </a>
            )}

            {(activeTab === "nodejs" || activeTab === "mysql") && schemaData && (
              <button
                onClick={() => copyCode(activeTab === "nodejs" ? (schemaData.nodeJsCode || "") : schemaData.mysqlSchema)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-xs">
          {activeTab === "nodejs" && schemaData && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 font-sans text-xs flex items-center justify-between">
                <span>Active Server Runtime: <strong className="font-bold text-white">Node.js (v22) + Express 4.21 (server.ts)</strong></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">PORT 3000</span>
              </div>
              <pre className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
                {schemaData.nodeJsCode || `// Node.js Express Server is active on port 3000`}
              </pre>
            </div>
          )}
          {activeTab === "erd" && (
            <div className="space-y-6 font-sans">
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl">
                <h4 className="font-bold text-emerald-400 text-sm">Relational Flow Structure</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  The application connects the frontend React client via Axios to the REST API controllers.
                  Data flows with full foreign key constraints and transactional integrity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "users",
                    desc: "Registered customers with shipping profiles",
                    cols: ["id (PK)", "name", "email (UNIQUE)", "password_hash", "phone", "address", "city", "zip_code"]
                  },
                  {
                    name: "admins",
                    desc: "System administrators with permission flags",
                    cols: ["id (PK)", "username (UNIQUE)", "email", "password_hash", "role", "permissions (JSON)"]
                  },
                  {
                    name: "categories",
                    desc: "Product taxonomies & hierarchy",
                    cols: ["id (PK)", "name", "slug (UNIQUE)", "description", "image", "icon", "is_active"]
                  },
                  {
                    name: "products",
                    desc: "Inventory items with pricing & stock",
                    cols: ["id (PK)", "category_id (FK)", "name", "slug", "price", "discount_price", "stock_quantity", "sku (UNIQUE)", "rating"]
                  },
                  {
                    name: "cart & cart_items",
                    desc: "Shopping carts & session line items",
                    cols: ["id (PK)", "user_id (FK)", "cart_id (FK)", "product_id (FK)", "quantity", "price"]
                  },
                  {
                    name: "orders & order_items",
                    desc: "Completed orders with tracking & invoices",
                    cols: ["id (PK)", "order_number (UNIQUE)", "user_id (FK)", "shipping_status", "total_amount", "tracking_number"]
                  }
                ].map((t) => (
                  <div key={t.name} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold font-mono text-zinc-100 text-sm">{t.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{t.desc}</p>
                    <div className="border-t border-zinc-800/80 pt-2 space-y-1">
                      {t.cols.map((c, i) => (
                        <div key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "mysql" && schemaData && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 font-sans text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>File Location: <strong className="font-bold text-white font-mono">/backend/schema.sql</strong> &amp; <strong className="font-bold text-white font-mono">/backend/database.sql</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">10 Tables</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">Full Seed Data</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">3 Views</span>
                </div>
              </div>
              <pre className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
                {schemaData.mysqlSchema}
              </pre>
            </div>
          )}

          {activeTab === "php" && schemaData && (
            <pre className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-sky-300 overflow-x-auto leading-relaxed">
              {schemaData.phpPdoCode}
            </pre>
          )}

          {activeTab === "api" && schemaData && (
            <div className="space-y-3 font-sans">
              <h3 className="text-sm font-bold text-zinc-100 mb-2">Live REST API Specification</h3>
              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                {schemaData.restEndpoints.map((ep, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          ep.method === "POST"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : ep.method === "PUT"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : ep.method === "DELETE"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-zinc-200">{ep.path}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
