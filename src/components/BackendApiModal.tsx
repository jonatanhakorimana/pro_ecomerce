import React, { useState, useEffect } from "react";
import {
  X,
  Server,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Database,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl } from "../config/api.config";
import axios from "axios";

interface BackendApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackendApiModal: React.FC<BackendApiModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    status?: number;
    latencyMs?: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "endpoints" | "nodejs_starter">("settings");

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    const trimmed = apiUrl.trim();
    if (!trimmed || trimmed === "/api") {
      resetApiBaseUrl();
      setApiUrl("/api");
    } else {
      setApiUrl(trimmed);
      setApiBaseUrl(trimmed);
    }
    setTestResult(null);
    onRefreshData();
  };

  const handleResetDefault = () => {
    resetApiBaseUrl();
    setApiUrl("/api");
    setTestResult(null);
    onRefreshData();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = Date.now();
    try {
      const targetBase = apiUrl.trim() || "/api";
      const res = await axios.get(`${targetBase}/products`, {
        timeout: 5000
      });
      const latency = Date.now() - startTime;
      setTestResult({
        success: true,
        message: `Node.js Backend yakiriye ubusabe neza! HTTP ${res.status} OK. Yakiriye ibicuruzwa: ${Array.isArray(res.data?.data) ? res.data.data.length : '0'}`,
        status: res.status,
        latencyMs: latency
      });
    } catch (err: any) {
      const latency = Date.now() - startTime;
      setTestResult({
        success: false,
        message: err.response
          ? `Node.js Backend yagaruye ikosa: HTTP ${err.response.status} (${err.response.statusText || 'Error'})`
          : `Ntibyakunze kugera kuri ${apiUrl}: ${err.message || 'Network error / CORS issue'}`,
        status: err.response?.status,
        latencyMs: latency
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nodeJsSampleCode = `import express from "express";
import cors from "cors";

// ==============================================================
// SHOP EAZY - NODE.JS + EXPRESS REST API BACKEND
// server.ts / server.js (Node.js runtime, port 3000)
// ==============================================================

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS & JSON Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 2. Data store / Model (MongoDB, PostgreSQL, MySQL or In-Memory)
let products = [
  {
    id: 1,
    name: "Aura Pro Wireless Headphones",
    slug: "aura-pro-wireless",
    description: "Spatial audio, active noise cancellation, and 40h battery.",
    price: 299.99,
    stockQuantity: 24,
    categoryId: 1,
    rating: 4.9,
    reviewsCount: 128
  }
];

// 3. GET /api/products
app.get("/api/products", (req, res) => {
  res.json({
    status: "success",
    total: products.length,
    data: products
  });
});

// 4. POST /api/orders (Checkout)
app.post("/api/orders", (req, res) => {
  const { customerName, customerEmail, items } = req.body;
  const orderNumber = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const trackingNumber = "TRK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newOrder = {
    id: Date.now(),
    orderNumber,
    customerName,
    customerEmail,
    items,
    trackingNumber,
    status: "processing"
  };

  res.json({ status: "success", message: "Order placed successfully!", order: newOrder });
});

app.listen(PORT, () => {
  console.log(\`Node.js Express REST Backend listening on port \${PORT}\`);
});`;


  return (
    <div id="backend-api-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Igenamiterere rya Backend API
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Easy Connect
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Hindura URL ya Backend yawe (PHP, Node, Laravel) cyangwa urebe ama endpoints akenewe.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-6">
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "settings"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>API URL & Guhuza (Connect)</span>
          </button>
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "endpoints"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ama Endpoints (REST Contract)</span>
          </button>
          <button
            onClick={() => setActiveTab("nodejs_starter")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "nodejs_starter"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Node.js API Server Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Info Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Node.js &amp; Express REST Backend iri gukora neza</span>
                </div>
                <p className="text-emerald-300/80 leading-relaxed">
                  Urubuga rurimo gukorera kuri Node.js backend (Express.js) kuri port 3000. API routes zose ziri muri <code className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-200">/api/*</code>. Ushobora kwifashisha iyi URL cyangwa ukinjiza indi URL ya Node.js backend yaba iri gukora ahandi.
                </p>
              </div>

              {/* URL Input Form */}
              <div className="space-y-3 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800">
                <label className="font-bold text-zinc-200 block text-xs">
                  Backend API Base URL:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="e.g. http://localhost:3000/api cyangwa /api"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Bika (Save)</span>
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-emerald-400" : ""}`} />
                    <span>Gerageza (Test Ping)</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1">
                  <span>
                    URL y'ubu: <strong className="text-emerald-400 font-mono">{getApiBaseUrl()}</strong>
                  </span>
                  <button
                    onClick={handleResetDefault}
                    className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                  >
                    Garura Default (/api)
                  </button>
                </div>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                    testResult.success
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-xs">{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <p className="text-[10px] opacity-80 font-mono">
                        Latency: {testResult.latencyMs}ms | Status Code: {testResult.status || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step by Step Guide in Kinyarwanda */}
              <div className="space-y-3 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  Uburyo Node.js Backend ikora mu ntambwe 3:
                </h3>
                <div className="space-y-2 text-zinc-300">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong>Node.js + Express Server:</strong> Backend iri gukorera kuri Node.js runtime (server.ts), itanga REST API kuri port 3000.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong>Full REST Endpoints:</strong> Inzira zose zirimo <code className="bg-zinc-800 px-1 py-0.5 rounded text-emerald-300">/api/products</code>, <code className="bg-zinc-800 px-1 py-0.5 rounded text-emerald-300">/api/orders</code>, na <code className="bg-zinc-800 px-1 py-0.5 rounded text-emerald-300">/api/cart</code> zirakora neza.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong>Dynamic URL:</strong> URL y'ibanze ni <code className="bg-zinc-800 px-1 py-0.5 rounded text-emerald-300">/api</code>. Niba ufite indi Node.js service, ushobora kuyishyiramo hejuru.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "endpoints" && (
            <div className="space-y-4">
              <p className="text-zinc-400">
                Izi nizo API routes Frontend ihamagara. Witondere kugarura JSON ifite format yerekanywe:
              </p>
              <div className="space-y-2">
                {[
                  {
                    method: "GET",
                    path: "/products",
                    desc: "Gusoma ibicuruzwa byose",
                    response: `{ "status": "success", "total": 2, "data": [ { "id": 1, "name": "...", "price": 99.99, "stockQuantity": 10, "image": "..." } ] }`
                  },
                  {
                    method: "GET",
                    path: "/categories",
                    desc: "Gusoma ibyiciro by'ibicuruzwa",
                    response: `{ "status": "success", "data": [ { "id": 1, "name": "Electronics", "slug": "electronics" } ] }`
                  },
                  {
                    method: "POST",
                    path: "/auth/login",
                    desc: "Kwinjira kw'umukiriya cyangwa admin",
                    response: `{ "status": "success", "token": "jwt_token_here", "user": { "id": 1, "name": "...", "email": "...", "role": "customer" } }`
                  },
                  {
                    method: "POST",
                    path: "/orders",
                    desc: "Gukora order nshya nyuma ya checkout",
                    response: `{ "status": "success", "message": "Order placed successfully", "order": { "id": 101, "orderNumber": "ORD-1234", "totalAmount": 150.0 } }`
                  },
                  {
                    method: "POST",
                    path: "/admin/products",
                    desc: "Kongeramo igicuruzwa muri Admin",
                    response: `{ "status": "success", "message": "Product created", "data": { "id": 5, "name": "..." } }`
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.method === "GET" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {item.method}
                        </span>
                        <span className="text-zinc-200 font-bold">{item.path}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-sans">{item.desc}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 bg-zinc-900/80 p-2 rounded-lg overflow-x-auto">
                      {item.response}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "nodejs_starter" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Node.js Express REST Backend Code (<code className="text-emerald-400 font-bold font-mono">server.ts</code>):</span>
                <button
                  onClick={() => copyToClipboard(nodeJsSampleCode, "nodejs_code")}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "nodejs_code" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Node.js Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96 leading-relaxed">
                {nodeJsSampleCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors"
          >
            Funga (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
