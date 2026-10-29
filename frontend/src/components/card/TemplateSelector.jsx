const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Navy & gold, serif', color: '#0f172a' },
  { id: 'modern', name: 'Modern', desc: 'Gradient, sans-serif', color: '#6366f1' },
  { id: 'minimal', name: 'Minimal', desc: 'Black & white, Swiss', color: '#0a0a0a' },
];

export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="template-selector">
      <h3>Card Template</h3>
      <div className="template-grid">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`template-option ${value === t.id ? 'template-option--active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <div className="template-option__preview" style={{ background: t.color }}>
              <div className="template-option__bars" />
            </div>
            <div className="template-option__info">
              <div className="template-option__name">{t.name}</div>
              <div className="template-option__desc">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
