import { useEffect, useState } from "react";
import CategoryPageContent from "../components/CategoryPageContent";

const menHero =
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function MenPage() {
  const [menProducts, setMenProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const filtered = (Array.isArray(data) ? data : []).filter((product) => {
          const productCategories = product.categories || product.tags || [];
          return productCategories.map((item) => String(item).toLowerCase()).includes("men");
        });
        setMenProducts(filtered);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      <CategoryPageContent
        title="Men"
        subtitle="Modern staples, street-ready silhouettes, and everyday comfort built for movement."
        image={menHero}
        products={menProducts}
      />
    </main>
  );
}
