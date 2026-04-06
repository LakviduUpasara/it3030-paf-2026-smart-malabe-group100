function InfoCard({ title, description }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </article>
  );
}

export default InfoCard;

