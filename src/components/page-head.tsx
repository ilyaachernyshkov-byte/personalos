export function PageHead({
  title,
  subtitle,
  mode,
}: {
  title: string;
  subtitle: string;
  mode?: string;
}) {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">PERSONAL WORKSPACE</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {mode === "demo" && (
        <div className="demo-banner">
          <span className="dot" />
          Демо-режим: Google Sheets не подключён
        </div>
      )}
    </>
  );
}
