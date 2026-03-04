import { useEffect, useState } from "react";
import CategoryPageContent from "../components/CategoryPageContent";

const kidsHero =
  "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=1400&q=80";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function KidsPage() {
  const [kidsProducts, setKidsProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const filtered = (Array.isArray(data) ? data : []).filter((product) => {
          const productCategories = product.categories || product.tags || [];
          return productCategories.map((item) => String(item).toLowerCase()).includes("kids");
        });
        setKidsProducts(filtered);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      <CategoryPageContent
        title="Kids"
        subtitle="Play-ready outfits with soft fabrics, easy fit, and durable comfort."
        image={kidsHero}
        products={kidsProducts}
      />
    </main>
  );
}
