import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Navbar ── */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-extrabold tracking-tight">
          <span className="text-indigo-600">CodeSmart</span>NG
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="grid md:grid-cols-2 gap-12 items-center px-6 py-20 max-w-7xl mx-auto">
        <div>
          <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
            🚀 The #1 ID Card Maker in Nigeria
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Create & Issue <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Professional ID Cards</span> in Minutes.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
            Design custom ID cards for your organization, collect payments securely via Paystack, 
            and generate high-quality PDF cards instantly.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link to="/register" className="px-8 py-3.5 rounded-xl font-bold text-lg text-white bg-indigo-600 hover:bg-indigo-700 transition text-center">
              Create Free Account
            </Link>
            <Link to="/verify/12345" className="px-8 py-3.5 rounded-xl font-bold text-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition text-center">
              Verify a Card
            </Link>
          </div>
        </div>

        {/* Mock Card Visual */}
        <div className="flex justify-center perspective-1000">
          <div className="w-full max-w-md aspect-[1.588] bg-white rounded-2xl shadow-2xl overflow-hidden transform md:-rotate-y-12 md:rotate-x-6 hover:rotate-0 transition-transform duration-500 ease-out border border-slate-100">
            <div className="bg-slate-900 p-5 flex items-center gap-4">
              <div className="w-8 h-8 bg-white rounded-md" />
              <div className="text-white font-bold text-lg">Acme Corporation</div>
            </div>
            <div className="p-6 flex gap-6">
              <div className="w-24 h-28 bg-slate-200 rounded-lg border-4 border-amber-500" />
              <div>
                <div className="text-xl font-extrabold text-slate-900">John Doe</div>
                <div className="text-sm text-slate-500 mt-1">Senior Software Engineer</div>
                <div className="font-mono font-bold text-slate-900 mt-4 text-sm">ID: ACME-2026-0001</div>
              </div>
            </div>
            <div className="absolute bottom-0 w-full bg-slate-900 text-white px-6 py-3 flex justify-between text-xs uppercase tracking-wider">
              <div>Valid Until: 2028</div>
              <div className="text-amber-500 font-bold">OFFICIAL ID</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section className="bg-white py-24 px-6">
        <h2 className="text-3xl font-extrabold text-center mb-16">
          Everything you need to manage ID cards
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:-translate-y-1 hover:border-indigo-500 transition-all duration-300">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3">Custom Templates</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Choose from multiple beautifully designed templates or customize your own colors and logos.</p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:-translate-y-1 hover:border-indigo-500 transition-all duration-300">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-3">Seamless Payments</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Collect payments securely via Paystack. Automated receipts and instant card generation.</p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:-translate-y-1 hover:border-indigo-500 transition-all duration-300">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold mb-3">Secure Verification</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Every card gets a unique QR code so employers and security can verify its authenticity instantly.</p>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center py-8 bg-slate-900 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} CodeSmartNG. All rights reserved.</p>
      </footer>
    </div>
  );
}
