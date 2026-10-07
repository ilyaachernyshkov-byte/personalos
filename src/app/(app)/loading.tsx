export default function Loading() {
  return (
    <div aria-label="Загрузка" className="loading">
      <div className="skeleton" />
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
