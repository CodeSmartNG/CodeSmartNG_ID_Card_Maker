
import { useRef, useState } from 'react';

export default function ImageUploader({ value, onChange, disabled }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB maximum)
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

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange({ file: null, preview: null });

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">

      {/* Image Preview */}
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        className={`
          relative flex h-40 w-40 cursor-pointer
          items-center justify-center overflow-hidden
          rounded-xl border-2 border-dashed
          transition-all duration-200
          ${preview
            ? 'border-blue-500 bg-gray-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        {preview ? (
          <img
            src={preview}
            alt="Member preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-4xl">📷</span>
            <span className="text-sm font-medium">
              Click to upload
            </span>
            <span className="text-xs text-gray-400">
              PNG, JPG (Max 5MB)
            </span>
          </div>
        )}
      </div>

      {/* Remove Button */}
      {preview && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-sm font-semibold text-red-600 transition hover:text-red-800"
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
      {error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

    </div>
  );
}
