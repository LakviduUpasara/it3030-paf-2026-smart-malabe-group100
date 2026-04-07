function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingSpinner;

