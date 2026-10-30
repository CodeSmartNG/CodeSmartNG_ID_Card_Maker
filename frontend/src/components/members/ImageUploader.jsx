import { useRef, useState } from 'react';

export default function ImageUploader({ value, onChange, disabled }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError('Must be under 5MB');
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      onChange({ file, preview: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange({ file: null, preview: null });
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div onClick={() => !disabled && fileRef.current?.click()} className="w-full max-w-[200px] aspect-[4/5] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden">
        {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-slate-400 text-center"><span className="text-4xl block mb-2">📷</span><span className="text-sm">Click to upload</span></div>}
      </div>
      {preview && !disabled && <button type="button" className="text-red-500 text-sm font-semibold hover:underline" onClick={handleRemove}>Remove photo</button>}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} disabled={disabled} hidden />
      {error && <span className="text-red-500 text-xs text-center">{error}</span>}
    </div>
  );
}
