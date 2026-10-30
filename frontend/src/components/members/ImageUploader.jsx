import { useRef, useState } from 'react';

export default function ImageUploader({ value, onChange, disabled }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      onChange({ file, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation(); // Prevent triggering the file picker when clicking remove
    setPreview(null);
    onChange({ file: null, preview: null });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      
      {/* Image Preview / Upload Box */}
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        className={`w-full max-w-[200px] aspect-[4/5] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden ${
          preview 
            ? 'border-slate-300 bg-slate-50' 
            : 'border-slate-300 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {preview ? (
          <img src={preview} alt="Member preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 text-center flex flex-col items-center p-4">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-sm font-medium">Click to upload</span>
          </div>
        )}
      </div>

      {/* Remove Button (Only shows if there is a preview) */}
      {preview && !disabled && (
        <button 
          type="button" 
          className="text-red-500 text-sm font-semibold hover:text-red-700 hover:underline transition" 
          onClick={handleRemove}
        >
          Remove photo
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={disabled}
        hidden
      />

      {/* Error Message */}
      {error && <span className="text-red-500 text-xs mt-1 block text-center">{error}</span>}
    </div>
  );
}
