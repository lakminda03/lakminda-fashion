import heroImage from "../assets/hero.jpg";

export default function Hero() {
  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-overlay" />
      <div className="container hero-content">
        <p className="eyebrow">Lakminda Fashion Collection</p>
        <h1>Everyday Fashion for Every Style</h1>
        <p className="subtitle">
          Explore curated looks for Men, Women, Kids, and Unisex wear.
        </p>
        <div className="hero-actions">
          <a href="#shop-categories" className="hero-cta">
            Shop by Categories
          </a>
          <a href="#featured-products" className="hero-cta ghost">
            View Featured Products
          </a>
        </div>
      </div>
    </section>
  );
}
