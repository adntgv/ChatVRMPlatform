import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Meta } from "@/components/meta";
import { analytics } from "@/lib/analytics";

export default function AdminDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Simple password protection (replace with proper auth in production)
  const ADMIN_PASSWORD = "chatvrm2025"; // TODO: Move to env variable

  useEffect(() => {
    // Check if already authenticated in session
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('admin_auth') === 'true';
      if (isAuth) {
        setAuthenticated(true);
        loadMetrics();
      }
    }
  }, []);

  const loadMetrics = () => {
    const calculatedMetrics = analytics.calculateMetrics();
    setMetrics(calculatedMetrics);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      loadMetrics();
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    setPassword("");
  };

  const handleExportData = () => {
    const data = analytics.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analytics.clearData();
      loadMetrics();
      alert('Analytics data cleared');
    }
  };

  if (!authenticated) {
    return (
      <div className="font-M_PLUS_2 min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Meta />
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-M_PLUS_2 min-h-screen bg-gray-100">
      <Meta />

      {/* Header */}
      <div className="bg-gray-900 text-white p-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Validation Metrics Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {metrics && (
          <>
            {/* Gate A: Interest */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-600">Gate A:</span> Interest
                <span className="text-sm font-normal text-gray-500">(Target: 15-25% CTR)</span>
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Landing Views</div>
                  <div className="text-3xl font-bold text-blue-600">{metrics.gateA.landingViews}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Demo Clicks</div>
                  <div className="text-3xl font-bold text-blue-600">{metrics.gateA.demoClicks}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Demo CTR</div>
                  <div className={`text-3xl font-bold ${parseFloat(metrics.gateA.demoCTR) >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                    {metrics.gateA.demoCTR}%
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Waitlist Signups</div>
                  <div className="text-3xl font-bold text-blue-600">{metrics.gateA.waitlistSubmits}</div>
                  <div className="text-xs text-gray-500 mt-1">{metrics.gateA.waitlistCTR}% of views</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Status:</div>
                {parseFloat(metrics.gateA.demoCTR) >= 15 ? (
                  <div className="text-green-600 font-bold">✓ Gate A PASSING (Demo CTR ≥ 15%)</div>
                ) : (
                  <div className="text-orange-600 font-bold">⚠ Gate A needs improvement (Target: 15-25% CTR)</div>
                )}
              </div>
            </div>

            {/* Gate B: Use */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-600">Gate B:</span> Use
                <span className="text-sm font-normal text-gray-500">(Target: 40% start rate, 3+ min sessions, 20% wizard starts)</span>
              </h2>
              <div className="grid md:grid-cols-5 gap-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Demo Starts</div>
                  <div className="text-3xl font-bold text-purple-600">{metrics.gateB.demoStarts}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Start Rate</div>
                  <div className={`text-3xl font-bold ${parseFloat(metrics.gateB.demoStartRate) >= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                    {metrics.gateB.demoStartRate}%
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Messages Sent</div>
                  <div className="text-3xl font-bold text-purple-600">{metrics.gateB.demoMessages}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Median Session</div>
                  <div className={`text-3xl font-bold ${metrics.gateB.medianSessionDuration >= 180 ? 'text-green-600' : 'text-orange-600'}`}>
                    {Math.floor(metrics.gateB.medianSessionDuration / 60)}m
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{metrics.gateB.medianSessionDuration}s total</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Wizard Starts</div>
                  <div className="text-3xl font-bold text-purple-600">{metrics.gateB.wizardStarts}</div>
                  <div className="text-xs text-gray-500 mt-1">{metrics.gateB.wizardStartRate}% of demos</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Status:</div>
                {parseFloat(metrics.gateB.demoStartRate) >= 40 && metrics.gateB.medianSessionDuration >= 180 && parseFloat(metrics.gateB.wizardStartRate) >= 20 ? (
                  <div className="text-green-600 font-bold">✓ Gate B PASSING (All targets met)</div>
                ) : (
                  <div className="text-orange-600 font-bold">⚠ Gate B needs improvement</div>
                )}
              </div>
            </div>

            {/* Gate C: Money */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-green-600">Gate C:</span> Money
                <span className="text-sm font-normal text-gray-500">(Target: 3-5 paid or 1+ LOI)</span>
              </h2>
              <div className="grid md:grid-cols-5 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Payment Intents</div>
                  <div className="text-3xl font-bold text-green-600">{metrics.gateC.paymentIntents}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Payments</div>
                  <div className="text-3xl font-bold text-green-600">{metrics.gateC.paymentsComplete}</div>
                  <div className="text-xs text-gray-500 mt-1">{metrics.gateC.paymentConversionRate}% conversion</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Pilot Inquiries</div>
                  <div className="text-3xl font-bold text-green-600">{metrics.gateC.pilotInquiries}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Trial Conversions</div>
                  <div className="text-3xl font-bold text-green-600">{metrics.gateC.trialConversions}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-400">
                  <div className="text-sm text-gray-600 mb-1 font-bold">Total Money Signals</div>
                  <div className="text-4xl font-bold text-green-600">{metrics.gateC.totalMoneySignals}</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Status:</div>
                {metrics.gateC.totalMoneySignals >= 3 ? (
                  <div className="text-green-600 font-bold">✓ Gate C PASSING ({metrics.gateC.totalMoneySignals} money signals ≥ 3)</div>
                ) : (
                  <div className="text-orange-600 font-bold">⚠ Gate C needs improvement (Target: 3-5 paid or 1+ LOI)</div>
                )}
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Conversion Funnel</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium">Landing Views</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold" style={{ width: '100%' }}>
                      {metrics.gateA.landingViews}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium">Demo Clicks</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div className="bg-blue-500 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                         style={{ width: `${metrics.gateA.landingViews > 0 ? (metrics.gateA.demoClicks / metrics.gateA.landingViews * 100) : 0}%` }}>
                      {metrics.gateA.demoClicks}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium">Demo Starts</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div className="bg-purple-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                         style={{ width: `${metrics.gateA.landingViews > 0 ? (metrics.gateB.demoStarts / metrics.gateA.landingViews * 100) : 0}%` }}>
                      {metrics.gateB.demoStarts}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium">Wizard Starts</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div className="bg-purple-500 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                         style={{ width: `${metrics.gateA.landingViews > 0 ? (metrics.gateB.wizardStarts / metrics.gateA.landingViews * 100) : 0}%` }}>
                      {metrics.gateB.wizardStarts}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium">Money Signals</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                         style={{ width: `${metrics.gateA.landingViews > 0 ? (metrics.gateC.totalMoneySignals / metrics.gateA.landingViews * 100) : 0}%` }}>
                      {metrics.gateC.totalMoneySignals}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Data Management</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleExportData}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  Export Data (JSON)
                </button>
                <button
                  onClick={handleClearData}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
