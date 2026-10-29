export default function Spinner({ fullScreen = false, size = 'md' }) {
  const cls = `spinner spinner--${size}${fullScreen ? ' spinner--full' : ''}`;
  return <div className={cls} aria-label="Loading" />;
}
