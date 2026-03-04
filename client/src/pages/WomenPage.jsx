import { useEffect, useState } from "react";
import CategoryPageContent from "../components/CategoryPageContent";

const womenHero =
  "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function WomenPage() {
  const [womenProducts, setWomenProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const filtered = (Array.isArray(data) ? data : []).filter((product) => {
          const productCategories = product.categories || product.tags || [];
          return productCategories.map((item) => String(item).toLowerCase()).includes("women");
        });
        setWomenProducts(filtered);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      <CategoryPageContent
        title="Women"
        subtitle="Elevated essentials and bold statement pieces with a clean streetwear edge."
        image={womenHero}
        products={womenProducts}
      />
    </main>
  );
}
