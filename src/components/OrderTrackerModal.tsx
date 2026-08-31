import React, { useState, useEffect } from "react";
import {
  X,
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";
import { Order } from "../types";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber = ""
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<{ status: string; date: string; location: string; completed: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && initialTrackingNumber) {
      setTrackingNumber(initialTrackingNumber);
      handleTrack(initialTrackingNumber);
    }
  }, [isOpen, initialTrackingNumber]);

  if (!isOpen) return null;

  const handleTrack = async (trackNum: string) => {
    if (!trackNum.trim()) return;

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await api.orders.track(trackNum.trim());
      setOrder(res.order);
      setEvents(res.trackingEvents);
    } catch (err: any) {
      setOrder(null);
      setEvents([]);
      setErrorMsg(err.response?.data?.message || "No shipment found with this tracking ID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(trackingNumber);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Logistics Tracker</h2>
              <p className="text-xs text-zinc-400">Track real-time carrier milestones and delivery estimates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Demos */}
        <div className="p-6 pb-2 space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter Tracking # (e.g. TRK-EXP-992147 or ORD-2026-8910)"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-zinc-500 focus:outline-none uppercase"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              {isLoading ? "Locating..." : "Track Package"}
            </button>
          </form>

          {/* Quick Tracking Presets */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 pt-1">
            <span>Quick Test:</span>
            {["TRK-EXP-992147", "TRK-GND-551029", "TRK-GND-882310"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setTrackingNumber(code);
                  handleTrack(code);
                }}
                className="px-2 py-0.5 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Result Area */}
        <div className="p-6 sm:p-7 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              {/* Status Header card */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-zinc-500 block">Shipment Status</span>
                  <span className="text-xl font-black text-emerald-400 capitalize flex items-center gap-2 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                    {order.shippingStatus === "delivered"
                      ? "Delivered Successfully"
                      : order.shippingStatus === "shipped"
                      ? "In Transit (On Schedule)"
                      : "Fulfillment in Progress"}
                  </span>
                  <span className="text-xs text-zinc-400 block mt-1">
                    Carrier: {order.shippingMethod}
                  </span>
                </div>

                <div className="text-right text-xs">
                  <span className="text-zinc-500 block">Destination:</span>
                  <span className="font-semibold text-white">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </span>
                </div>
              </div>

              {/* Step Timeline */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Carrier Milestone Events</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                  {events.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          evt.completed
                            ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20"
                            : "bg-zinc-900 border-zinc-700 text-zinc-600"
                        }`}
                      >
                        {evt.completed && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold ${evt.completed ? "text-zinc-100" : "text-zinc-500"}`}
                          >
                            {evt.status}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {new Date(evt.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{evt.location}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!order && !errorMsg && !isLoading && (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Enter an active tracking number or select one of the quick test presets above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
