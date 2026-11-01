const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Navy & gold, serif', color: '#0f172a' },
  { id: 'modern', name: 'Modern', desc: 'Gradient, sans-serif', color: '#6366f1' },
  { id: 'minimal', name: 'Minimal', desc: 'Black & white, Swiss', color: '#0a0a0a' },
];

export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Card Template
      </h3>
      
      <div className="flex flex-col gap-3">
        {TEMPLATES.map((t) => {
          const isActive = value === t.id;
          
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`relative flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all duration-200 w-full group ${
                isActive 
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600/20' 
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Color Preview Swatch */}
              <div 
                className="w-14 h-9 rounded-md shadow-inner flex flex-col justify-end p-1.5 relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: t.color }}
              >
                <div className="w-6 h-1 bg-white/30 rounded-full mb-1"></div>
                <div className="w-10 h-1 bg-white/20 rounded-full"></div>
              </div>

              {/* Text Info */}
              <div className="flex-1">
                <div className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                  {t.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t.desc}
                </div>
              </div>

              {/* Custom Radio Selection Circle */}
              <div className="flex-shrink-0 ml-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isActive ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
