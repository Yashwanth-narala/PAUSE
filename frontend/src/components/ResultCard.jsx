function Card({ title, children, className = "" }) {
  return (
    <section className={`card result-card ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default Card;
