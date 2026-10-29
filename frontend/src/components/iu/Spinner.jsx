// frontend/src/components/ui/Spinner.jsx
export default function Spinner({ fullScreen = false, size = 'md' }) {
  const sizeMap = { sm: 20, md: 40, lg: 60 };
  const px = sizeMap[size] || 40;

  const spinner = (
    <div
      style={{
        width: px,
        height: px,
        border: `${px / 8}px solid #e2e8f0`,
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {fullScreen ? (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          {spinner}
        </div>
      ) : (
        spinner
      )}
    </>
  );
}
