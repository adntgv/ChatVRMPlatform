import { useState } from "react";
import { useRouter } from "next/router";
import { Meta } from "@/components/meta";
import { analytics, usePageView } from "@/lib/analytics";

export default function PilotInquiryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    teamSize: "21-100",
    useCase: "",
    requirements: "",
    budget: "$500-1000",
    timeline: "month",
  });
  const [submitted, setSubmitted] = useState(false);

  usePageView('pilot-inquiry');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    analytics.track('pilot_inquiry_submit', {
      ...formData,
      source: 'pilot_inquiry_page'
    });

    // TODO: Send to actual CRM/email service
    console.log('Pilot inquiry:', formData);

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="font-M_PLUS_2 min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Meta />
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Inquiry Received!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for your interest in a pilot program. Our team will review your requirements and get back to you within 1 business day.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">Next Steps:</h2>
            <ul className="text-left space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">1.</span>
                <span>Our team will review your use case and requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">2.</span>
                <span>We&apos;ll schedule a call to discuss your pilot program</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">3.</span>
                <span>We&apos;ll create a custom proposal and timeline</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 font-bold">4.</span>
                <span>If approved, we&apos;ll kick off your pilot implementation</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/')}
              className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all"
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
    <div className="font-M_PLUS_2 min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Meta />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-sm opacity-75 hover:opacity-100 transition-opacity"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Enterprise Pilot Program
          </h1>
          <p className="text-lg opacity-90">
            Custom solutions for teams and organizations
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Info Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6">What&apos;s a Pilot Program?</h2>
                <p className="text-gray-600 mb-6">
                  We work with your team to deploy custom AI assistants tailored to your specific needs, with hands-on support throughout the process.
                </p>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Ideal for:</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">•</span>
                      <span className="text-gray-700">Teams needing multiple assistants</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">•</span>
                      <span className="text-gray-700">Enterprise integrations (Slack, Teams, etc.)</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">•</span>
                      <span className="text-gray-700">Custom VRM character development</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">•</span>
                      <span className="text-gray-700">White-label deployment</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-600 text-xl">•</span>
                      <span className="text-gray-700">Dedicated support and SLAs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
                <h3 className="font-bold text-lg mb-4">Pricing</h3>
                <p className="text-gray-700 mb-4">
                  Custom pricing based on your requirements. Typical pilot programs range from:
                </p>
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  $500 - $5,000
                </div>
                <p className="text-sm text-gray-600">
                  Includes setup, customization, training, and support
                </p>
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Request a Pilot</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Work Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company / Organization *</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Role *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. CTO, Product Manager, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Size *</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="6-20">6-20 people</option>
                    <option value="21-100">21-100 people</option>
                    <option value="101-500">101-500 people</option>
                    <option value="500+">500+ people</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Use Case Summary *</label>
                  <textarea
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    placeholder="Briefly describe what you want to build (2-3 sentences)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Specific Requirements</label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Any specific features, integrations, or constraints? (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Budget Range</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="$500-1000">$500 - $1,000</option>
                    <option value="$1000-2500">$1,000 - $2,500</option>
                    <option value="$2500-5000">$2,500 - $5,000</option>
                    <option value="$5000+">$5,000+</option>
                    <option value="flexible">Flexible / TBD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="asap">ASAP (within 2 weeks)</option>
                    <option value="month">Within a month</option>
                    <option value="quarter">This quarter</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all"
                >
                  Submit Pilot Request
                </button>

                <p className="text-xs text-gray-500 text-center">
                  We&apos;ll review your inquiry and respond within 1 business day
                </p>
              </form>
            </div>
          </div>

          {/* Case Studies / Social Proof */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Pilot Program Benefits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-bold mb-2">Rapid Deployment</h3>
                <p className="text-sm text-gray-600">
                  Go from concept to production in weeks, not months
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="font-bold mb-2">Dedicated Support</h3>
                <p className="text-sm text-gray-600">
                  Direct access to our team throughout the pilot
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-bold mb-2">Measurable Results</h3>
                <p className="text-sm text-gray-600">
                  Track success metrics and ROI from day one
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
