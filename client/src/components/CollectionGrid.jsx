import { NavLink } from "react-router-dom";

const collections = [
  {
    name: "Men",
    path: "/men",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Women",
    path: "/women",
    image:
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Kids",
    path: "/kids",
    image:
      "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Unisex",
    path: "/unisex",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
  }
];

export default function CollectionGrid() {
  return (
    <section className="section" id="shop-categories">
      <div className="container">
        <div className="section-heading">
          <h2>Shop by Categories</h2>
        </div>
        <div className="collections">
          {collections.map((collection) => (
            <article className="collection-card" key={collection.name}>
              <img src={collection.image} alt={collection.name} />
              <div>
                <h3>{collection.name}</h3>
                <NavLink to={collection.path}>View Category</NavLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
