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

  const handleRemove = () => {
    setPreview(null);
    onChange({ file: null, preview: null });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="image-uploader">
      <div
        className={`image-uploader__preview ${!preview ? 'image-uploader__preview--empty' : ''}`}
        onClick={() => !disabled && fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Member preview" />
        ) : (
          <div className="image-uploader__placeholder">
            <span>📷</span>
            <span>Click to upload</span>
          </div>
        )}
      </div>

      {preview && !disabled && (
        <button type="button" className="btn-text-danger" onClick={handleRemove}>
          Remove photo
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={disabled}
        hidden
      />

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
