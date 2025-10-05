import { useState } from "react";
import { useRouter } from "next/router";
import { Meta } from "@/components/meta";
import { analytics, usePageView } from "@/lib/analytics";

export default function ReservePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    useCase: "",
    teamSize: "1-5",
    timeline: "asap",
    budget: "$49",
  });
  const [submitted, setSubmitted] = useState(false);

  usePageView('reserve');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    analytics.track('payment_intent_start', {
      ...formData,
      source: 'reserve_page'
    });

    // TODO: Integrate with actual payment processor (Stripe)
    // For now, just track the intent
    console.log('Reservation request:', formData);

    analytics.track('payment_complete', {
      amount: 49,
      ...formData
    });

    setSubmitted(true);
  };

  const handlePilotInquiry = () => {
    analytics.track('pilot_inquiry_submit', { source: 'reserve_page' });
    router.push('/pilot-inquiry');
  };

  if (submitted) {
    return (
      <div className="font-M_PLUS_2 min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Meta />
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Reservation Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for reserving your spot. We'll contact you within 24 hours to schedule your setup call.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">What happens next:</h2>
            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">1.</span>
                <span>You'll receive a confirmation email at <strong>{formData.email}</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Our team will reach out to schedule your 1-hour setup call</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">3.</span>
                <span>We'll build your custom assistant based on your requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">4.</span>
                <span>You'll receive your fully configured assistant ready to use</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/')}
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="w-full px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 text-lg font-bold rounded-lg transition-all"
            >
              Try Demo While You Wait
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-M_PLUS_2 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Meta />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm opacity-75 hover:opacity-100 transition-opacity"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Reserve Your Custom Assistant
          </h1>
          <p className="text-lg opacity-90">
            We'll build it for you — 1-hour setup call included
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pricing Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">$49</div>
                <div className="text-gray-600">One-time setup fee</div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="font-bold text-lg mb-4">What's included:</h3>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">1-hour personalized setup call</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Custom assistant configured to your needs</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">VRM model selection and setup</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Voice and personality customization</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">API key setup assistance</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">24-hour delivery guarantee</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Note:</strong> OpenAI API costs not included (typically $5-20/month)
                </p>
              </div>
            </div>

            {/* Reservation Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Reserve Your Spot</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Use Case *</label>
                  <select
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select one...</option>
                    <option value="vtuber">VTuber / Streaming Co-host</option>
                    <option value="education">Education / Course Tutor</option>
                    <option value="customer-support">Customer Support / Website Greeter</option>
                    <option value="other">Other (tell us in the call)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Size</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1-5">Just me / 1-5 people</option>
                    <option value="6-20">6-20 people</option>
                    <option value="21-100">21-100 people</option>
                    <option value="100+">100+ people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">When do you need this?</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asap">ASAP (within 48 hours)</option>
                    <option value="week">Within a week</option>
                    <option value="month">Within a month</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all"
                >
                  Reserve for $49 →
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Payment will be processed via Stripe after we confirm your requirements
                </p>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Need multiple assistants or enterprise features?
                </p>
                <button
                  onClick={handlePilotInquiry}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
                >
                  Request Enterprise Pilot →
                </button>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 text-center">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold mb-2">Fast Setup</h3>
                <p className="text-sm text-gray-600">
                  Most assistants delivered within 24 hours
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-bold mb-2">Secure & Private</h3>
                <p className="text-sm text-gray-600">
                  Your API keys and data stay with you
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl mb-2">💯</div>
                <h3 className="font-bold mb-2">Satisfaction Guaranteed</h3>
                <p className="text-sm text-gray-600">
                  Full refund if we can't meet your needs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
