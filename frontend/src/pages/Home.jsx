import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* ── Sticky Glass Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              CodeSmart<span className="text-indigo-600">NG</span>
            </span>
          </div>
          <div className="flex gap-3 sm:gap-4 items-center">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="flex-1 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            The #1 ID Card Platform in Nigeria
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 text-slate-900">
            Issue ID Cards <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">In Minutes.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
            Design professional ID cards for your school, staff, or organization. Collect payments securely and generate print-ready PDFs with QR verification instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/register" className="px-8 py-4 rounded-xl font-bold text-lg text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200">
              Create Free Account
            </Link>
            <Link to="/verify/12345" className="px-8 py-4 rounded-xl font-bold text-lg text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Verify a Card
            </Link>
          </div>
        </div>

        {/* 3D Floating Mock Card */}
        <div className="flex-1 flex justify-center lg:justify-end z-10 perspective-1000 w-full">
          <div className="relative w-full max-w-[420px] aspect-[1.588] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden transform lg:rotate-y-[-12deg] lg:rotate-x-[8deg] hover:rotate-0 transition-transform duration-700 ease-out border border-slate-100 group">
            
            {/* Holographic Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-20 pointer-events-none" />

            <div className="bg-[#0f172a] px-5 py-4 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded shadow-sm flex items-center justify-center">
                   <div className="w-4 h-4 bg-indigo-600 rounded-sm" />
                </div>
                <div className="text-white font-bold text-sm uppercase tracking-wide">Acme Schools</div>
              </div>
              <div className="text-amber-500 font-bold text-[9px] uppercase tracking-wider">Official ID</div>
            </div>
            
            <div className="px-6 py-5 flex gap-5">
              <div className="w-[85px] h-[105px] bg-slate-200 rounded-lg border-[3px] border-amber-500 flex items-center justify-center text-slate-400 shadow-sm">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="flex flex-col pt-1">
                <div className="text-2xl font-bold text-slate-900 leading-tight">John Doe</div>
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mt-1">Student</div>
                <div className="text-[10px] text-slate-500 italic">Grade 12 - Science</div>
                <div className="mt-3">
                  <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">ID Number</div>
                  <div className="text-sm font-bold font-mono text-slate-900">ACME-2026-0001</div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a] px-6 py-2 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-300">
              <span>Valid Until: 11/2028</span>
              <span className="text-amber-500 font-bold">Verify QR ⬛</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Social Proof (Trusted by) ── */}
      <section className="border-y border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by top organizations</p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 opacity-50 grayscale">
            {/* Fake Logos */}
            <div className="text-xl font-black text-slate-800">TechCorp</div>
            <div className="text-xl font-serif font-bold text-slate-800">Greenfield Academy</div>
            <div className="text-xl font-extrabold text-slate-800 tracking-tighter">JIBWIS</div>
            <div className="text-xl font-mono font-bold text-slate-800">SECURE_LTD</div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Everything you need to manage ID cards</h2>
          <p className="text-lg text-slate-500">From bulk member import to automated PDF generation, we've built the perfect workflow for your team.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="p-8 rounded-3xl bg-white border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Bulk CSV Import</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Upload your entire school or staff roster in seconds. We auto-generate unique IDs and handle everything for you.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Seamless Payments</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Collect payments securely via Paystack. Automated receipts and instant card generation upon success.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Secure QR Verification</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Every card gets a unique QR code. Security and employers can scan to instantly verify authenticity.</p>
          </div>

        </div>
      </section>

      {/* ── How it Works Section ── */}
      <section className="py-24 bg-slate-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">How it works</h2>
            <p className="text-lg text-slate-400">Get your team set up in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-slate-700 -z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]">1</div>
              <h3 className="text-xl font-bold mb-2">Add Members</h3>
              <p className="text-slate-400 text-sm max-w-xs">Type them in manually or bulk upload your entire list using our CSV template.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_30px_rgba(147,51,234,0.5)]">2</div>
              <h3 className="text-xl font-bold mb-2">Design & Pay</h3>
              <p className="text-slate-400 text-sm max-w-xs">Choose a template, preview the card live, and pay securely via Paystack.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">3</div>
              <h3 className="text-xl font-bold mb-2">Download PDFs</h3>
              <p className="text-slate-400 text-sm max-w-xs">Print-ready PDFs with QR codes are generated instantly and emailed to you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0f1c] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <span className="text-xl font-extrabold text-white">CodeSmartNG</span>
            </div>
            <p className="text-sm max-w-sm mb-6">The easiest way to design, pay for, and issue professional ID cards for your organization in Nigeria.</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition">Features</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Verify a Card</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          <p>© {new Date().getFullYear()} CodeSmartNG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
