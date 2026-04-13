export default function EntityLeftHeader({ title, logoSrc = "/logo.png" }) {
  return (
    <div className="entity-left-header">
      <img className="entity-left-logo" src={logoSrc} alt="Logo" />
      <div className="entity-left-title">{title}</div>
    </div>
  );
}
