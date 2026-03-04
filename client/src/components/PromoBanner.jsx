export default function PromoBanner() {
  return (
    <section className="promo">
      <div className="container promo-inner">
        <div>
          <p className="eyebrow">Members Perk</p>
          <h2>Get 10% Off Your First Order</h2>
          <p>Join our mailing list for early access to drops and private sale alerts.</p>
        </div>
        <form className="subscribe" onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit">Join Now</button>
        </form>
      </div>
    </section>
  );
}
