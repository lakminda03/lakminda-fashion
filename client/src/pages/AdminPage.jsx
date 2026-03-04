import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_AUTH_KEY,
  clearAuthSession,
  getAuthSession,
  setAuthSession
} from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADMIN_USER = "admin";
const ADMIN_PASS = "LkF@2026#Admin!Secure9";
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "LkF@2026#Admin!Secure9";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const TAG_OPTIONS = ["Men", "Women", "Kids", "Unisex"];

const initialForm = {
  name: "",
  price: "",
  image: "",
  subCategory: "",
  colors: [],
  sizes: [],
  sizePrices: {},
  categories: [],
  stockCount: "",
  isFeatured: false
};

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(
    sessionStorage.getItem(ADMIN_AUTH_KEY) === "true" || getAuthSession().role === "admin"
  );
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [customRequestLoading, setCustomRequestLoading] = useState(false);
  const [contactMessages, setContactMessages] = useState([]);
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("product-manager");
  const [listControls, setListControls] = useState({
    query: "",
    subCategory: "all",
    category: "all",
    featured: "all",
    stock: "all",
    sortBy: "latest"
  });

  const submitLabel = useMemo(() => (editingId ? "Update Product" : "Create Product"), [editingId]);
  const categorySuggestions = useMemo(
    () =>
      Array.from(
        new Set(products.map((item) => (item?.subCategory || item?.category || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const productCategoryOptions = useMemo(
    () =>
      Array.from(new Set(products.flatMap((item) => item.categories || item.tags || []).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );
  const visibleProducts = useMemo(() => {
    const query = listControls.query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const subCategory = String(product.subCategory || product.category || "").toLowerCase();
      const categories = (product.categories || product.tags || []).map((item) => String(item).toLowerCase());
      const isFeatured = Boolean(product.isFeatured);
      const stockCount = Number(product.stockCount || 0);

      if (query && !name.includes(query) && !subCategory.includes(query)) return false;
      if (listControls.subCategory !== "all" && subCategory !== listControls.subCategory.toLowerCase()) return false;
      if (listControls.category !== "all" && !categories.includes(listControls.category.toLowerCase())) return false;
      if (listControls.featured === "featured" && !isFeatured) return false;
      if (listControls.featured === "not-featured" && isFeatured) return false;
      if (listControls.stock === "in-stock" && stockCount <= 0) return false;
      if (listControls.stock === "out-of-stock" && stockCount > 0) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (listControls.sortBy) {
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name-asc":
          return String(a.name || "").localeCompare(String(b.name || ""));
        case "name-desc":
          return String(b.name || "").localeCompare(String(a.name || ""));
        case "price-low":
          return Number(a.price || 0) - Number(b.price || 0);
        case "price-high":
          return Number(b.price || 0) - Number(a.price || 0);
        case "stock-high":
          return Number(b.stockCount || 0) - Number(a.stockCount || 0);
        case "stock-low":
          return Number(a.stockCount || 0) - Number(b.stockCount || 0);
        case "latest":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [products, listControls]);
  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { totalOrders, totalRevenue };
  }, [orders]);
  const orderInsights = useMemo(() => {
    const productTotals = new Map();
    const customerTotals = new Map();
    const monthBuckets = [];
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 11; i >= 0; i -= 1) {
      const monthDate = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.push({
        key,
        label: monthDate.toLocaleString(undefined, { month: "short" }),
        year: monthDate.getFullYear(),
        count: 0
      });
    }

    const monthIndex = new Map(monthBuckets.map((bucket, idx) => [bucket.key, idx]));

    orders.forEach((order) => {
      const created = order.createdAt ? new Date(order.createdAt) : null;
      if (created && !Number.isNaN(created.getTime())) {
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        const idx = monthIndex.get(key);
        if (idx !== undefined) {
          monthBuckets[idx].count += 1;
        }
      }

      const userId = String(order.user?._id || order.user?.id || "");
      const customerName = String(order.user?.name || "Unknown Customer").trim();
      const customerEmail = String(order.user?.email || "").trim();
      const orderTotal = Number(order.total || 0);
      if (userId) {
        const existing = customerTotals.get(userId) || {
          id: userId,
          name: customerName,
          email: customerEmail,
          orders: 0,
          spent: 0
        };
        existing.orders += 1;
        existing.spent += Number.isNaN(orderTotal) ? 0 : orderTotal;
        if (!existing.name && customerName) existing.name = customerName;
        if (!existing.email && customerEmail) existing.email = customerEmail;
        customerTotals.set(userId, existing);
      }

      (order.items || []).forEach((item) => {
        const name = String(item?.name || "Unnamed Product").trim();
        const qty = Number(item?.quantity || 0);
        if (!name || qty <= 0) return;
        productTotals.set(name, (productTotals.get(name) || 0) + qty);
      });
    });

    const topProducts = Array.from(productTotals.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.orders - a.orders || b.spent - a.spent)
      .slice(0, 10);

    const maxMonthlyOrders = monthBuckets.reduce((max, month) => Math.max(max, month.count), 0);
    return { topProducts, topCustomers, monthlyOrders: monthBuckets, maxMonthlyOrders };
  }, [orders]);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrderLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/admin`, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };
  const fetchCustomRequests = async () => {
    setCustomRequestLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/custom-requests/admin`, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch custom requests");
      setCustomRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCustomRequestLoading(false);
    }
  };
  const fetchContactMessages = async () => {
    setContactMessagesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact-messages/admin`, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch contact messages");
      setContactMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setContactMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed) {
      fetchProducts();
      fetchOrders();
      fetchCustomRequests();
      fetchContactMessages();
    }
  }, [isAuthed]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (credentials.username === ADMIN_USER && credentials.password === ADMIN_PASS) {
      setAuthSession({ role: "admin", name: "Admin", persistent: false });
      setIsAuthed(true);
      setActiveSection("product-manager");
      setError("");
      setMessage("Signed in to admin panel.");
      return;
    }
    setError("Invalid admin credentials.");
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthed(false);
    setActiveSection("product-manager");
    setEditingId("");
    setFormData(initialForm);
    setProducts([]);
    setMessage("");
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const toggleMultiValue = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((item) => item !== value) : [...prev[field], value]
      };
    });
  };

  const toggleSizeSelection = (size) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      const nextSizes = exists ? prev.sizes.filter((item) => item !== size) : [...prev.sizes, size];
      const nextSizePrices = { ...(prev.sizePrices || {}) };

      if (exists) {
        delete nextSizePrices[size];
      } else {
        const fallback = Number(prev.price);
        nextSizePrices[size] = Number.isNaN(fallback) ? 0 : fallback;
      }

      return {
        ...prev,
        sizes: nextSizes,
        sizePrices: nextSizePrices
      };
    });
  };

  const handleSizePriceChange = (size, value) => {
    setFormData((prev) => ({
      ...prev,
      sizePrices: {
        ...(prev.sizePrices || {}),
        [size]: value
      }
    }));
  };

  const addCustomColor = () => {
    const color = colorInput.trim();
    if (!color) return;
    if (formData.colors.some((item) => item.toLowerCase() === color.toLowerCase())) {
      setColorInput("");
      return;
    }
    setFormData((prev) => ({ ...prev, colors: [...prev.colors, color] }));
    setColorInput("");
  };

  const removeColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((item) => item !== color)
    }));
  };

  const resetForm = () => {
    setEditingId("");
    setFormData(initialForm);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      price: product.price ?? "",
      image: product.image || "",
      subCategory: product.subCategory || product.category || "",
      colors: Array.isArray(product.colors) ? product.colors : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      sizePrices: product.sizePrices || {},
      categories: Array.isArray(product.categories)
        ? product.categories
        : Array.isArray(product.tags)
          ? product.tags
          : [],
      stockCount: product.stockCount ?? 0,
      isFeatured: Boolean(product.isFeatured)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
      setMessage("Product deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  const sectionTitleMap = {
    "product-manager": "Admin Product Manager",
    "product-list": "Product List",
    "order-management": "Order Management",
    "custom-requests": "Custom Requests",
    "contact-messages": "Contact Messages"
  };

  const handleSectionRefresh = () => {
    if (activeSection === "product-manager" || activeSection === "product-list") {
      fetchProducts();
      return;
    }
    if (activeSection === "order-management") {
      fetchOrders();
      return;
    }
    if (activeSection === "custom-requests") {
      fetchCustomRequests();
      return;
    }
    if (activeSection === "contact-messages") {
      fetchContactMessages();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      image: formData.image.trim(),
      subCategory: formData.subCategory,
      colors: formData.colors,
      sizes: formData.sizes,
      sizePrices: Object.fromEntries(
        (formData.sizes || []).map((size) => [size, Number(formData.sizePrices?.[size])])
      ),
      categories: formData.categories,
      stockCount: Number(formData.stockCount),
      isFeatured: formData.isFeatured
    };

    if (!payload.name || Number.isNaN(payload.price) || !payload.image || !payload.subCategory) {
      setError("Please fill Product name, Price, upload Image, and Sub Category.");
      return;
    }

    if (Number.isNaN(payload.stockCount) || payload.stockCount < 0) {
      setError("Stock count must be 0 or more.");
      return;
    }

    if ((payload.sizes || []).some((size) => Number.isNaN(payload.sizePrices?.[size]) || payload.sizePrices[size] < 0)) {
      setError("Each selected size must have a valid price.");
      return;
    }

    const isEdit = Boolean(editingId);
    const url = isEdit ? `${API_BASE_URL}/api/products/${editingId}` : `${API_BASE_URL}/api/products`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`${isEdit ? "Update" : "Create"} failed`);
      const saved = await response.json();

      if (isEdit) {
        setProducts((prev) => prev.map((item) => (item._id === saved._id ? saved : item)));
        setMessage("Product updated.");
      } else {
        setProducts((prev) => [saved, ...prev]);
        setMessage("Product created.");
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        body
      });

      if (!response.ok) throw new Error("Image upload failed");
      const data = await response.json();

      setFormData((prev) => ({ ...prev, image: data.image }));
      setMessage("Image uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  if (!isAuthed) {
    return (
      <main className="admin-wrap">
        <section className="admin-login">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin} className="admin-form">
            <input
              name="username"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <button type="submit">Sign In</button>
          </form>
          {error ? <p className="admin-error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-wrap">
      <section className="container admin-panel">
        <div className="admin-with-nav">
          <aside className="admin-vertical-nav">
            <h3>Sections</h3>
            <button
              type="button"
              className={activeSection === "product-manager" ? "active" : ""}
              onClick={() => setActiveSection("product-manager")}
            >
              Admin Product Manager
            </button>
            <button
              type="button"
              className={activeSection === "product-list" ? "active" : ""}
              onClick={() => setActiveSection("product-list")}
            >
              Product List
            </button>
            <button
              type="button"
              className={activeSection === "order-management" ? "active" : ""}
              onClick={() => setActiveSection("order-management")}
            >
              Order Management
            </button>
            <button
              type="button"
              className={activeSection === "custom-requests" ? "active" : ""}
              onClick={() => setActiveSection("custom-requests")}
            >
              Custom Requests
            </button>
            <button
              type="button"
              className={activeSection === "contact-messages" ? "active" : ""}
              onClick={() => setActiveSection("contact-messages")}
            >
              Contact Messages
            </button>
          </aside>

          <div className="admin-layout">
            {activeSection === "product-manager" || activeSection === "product-list" ? (
              <div className="admin-main" id="admin-products">
            <div className="admin-head">
              <h1>{activeSection === "product-manager" ? "Admin Product Manager" : "Product List"}</h1>
              <div className="admin-head-actions">
                <button type="button" onClick={fetchProducts}>
                  Refresh
                </button>
                <button type="button" onClick={handleLogout} className="danger-lite">
                  Logout
                </button>
              </div>
            </div>

            {activeSection === "product-manager" ? (
            <form onSubmit={handleSubmit} className="admin-form admin-grid">
              <input name="name" placeholder="Product name" value={formData.name} onChange={handleChange} required />
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                required
              />
              <div className="file-upload-group">
                <label className="file-label">Product Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploadingImage ? <p className="muted">Uploading image...</p> : null}
                {formData.image ? (
                  <img className="admin-preview-image" src={resolveImageUrl(formData.image)} alt="Uploaded preview" />
                ) : null}
              </div>

              <div className="file-upload-group">
                <label className="file-label">Sub Category</label>
                <input
                  name="subCategory"
                  list="category-options"
                  placeholder="Type sub category (e.g. T-Shirts)"
                  value={formData.subCategory}
                  onChange={handleChange}
                  required
                />
                <datalist id="category-options">
                  {categorySuggestions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <input
                name="stockCount"
                type="number"
                min="0"
                placeholder="Stock count"
                value={formData.stockCount}
                onChange={handleChange}
                required
              />

              <label className="admin-check">
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} />
                Featured Product
              </label>

              <div className="selector-group">
                <p>Colors</p>
                <div className="custom-color-row">
                  <input
                    type="text"
                    placeholder="Add color (e.g. Maroon)"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomColor();
                      }
                    }}
                  />
                  <button type="button" onClick={addCustomColor}>
                    Add Color
                  </button>
                </div>
                <div className="selector-options">
                  {formData.colors.map((color) => (
                    <span className="color-chip" key={color}>
                      {color}
                      <button type="button" onClick={() => removeColor(color)} aria-label={`Remove ${color}`}>
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="selector-group">
                <p>Sizes</p>
                <div className="selector-options">
                  {SIZE_OPTIONS.map((size) => (
                    <label key={size}>
                      <input
                        type="checkbox"
                        checked={formData.sizes.includes(size)}
                        onChange={() => toggleSizeSelection(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {formData.sizes.length ? (
                <div className="selector-group">
                  <p>Price by Size</p>
                  <div className="size-price-grid">
                    {formData.sizes.map((size) => (
                      <label key={size} className="size-price-item">
                        <span>{size}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.sizePrices?.[size] ?? ""}
                          onChange={(e) => handleSizePriceChange(size, e.target.value)}
                          required
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="selector-group">
                <p>Categories</p>
                <div className="selector-options">
                  {TAG_OPTIONS.map((tag) => (
                    <label key={tag}>
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(tag)}
                        onChange={() => toggleMultiValue("categories", tag)}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-actions">
                <button type="submit">{submitLabel}</button>
                {editingId ? (
                  <button type="button" className="secondary-btn" onClick={resetForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
            ) : null}

            {message ? <p className="admin-success">{message}</p> : null}
            {error ? <p className="admin-error">{error}</p> : null}

            {activeSection === "product-list" ? loading ? (
              <p>Loading products...</p>
            ) : (
              <div>
                <div className="admin-product-tools">
                  <input
                    type="text"
                    placeholder="Search product or sub category"
                    value={listControls.query}
                    onChange={(e) => setListControls((prev) => ({ ...prev, query: e.target.value }))}
                  />
                  <select
                    value={listControls.subCategory}
                    onChange={(e) => setListControls((prev) => ({ ...prev, subCategory: e.target.value }))}
                  >
                    <option value="all">All sub categories</option>
                    {categorySuggestions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={listControls.category}
                    onChange={(e) => setListControls((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="all">All categories</option>
                    {productCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={listControls.featured}
                    onChange={(e) => setListControls((prev) => ({ ...prev, featured: e.target.value }))}
                  >
                    <option value="all">All featured status</option>
                    <option value="featured">Featured only</option>
                    <option value="not-featured">Not featured</option>
                  </select>
                  <select
                    value={listControls.stock}
                    onChange={(e) => setListControls((prev) => ({ ...prev, stock: e.target.value }))}
                  >
                    <option value="all">All stock status</option>
                    <option value="in-stock">In stock</option>
                    <option value="out-of-stock">Out of stock</option>
                  </select>
                  <select
                    value={listControls.sortBy}
                    onChange={(e) => setListControls((prev) => ({ ...prev, sortBy: e.target.value }))}
                  >
                    <option value="latest">Sort: Latest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="name-asc">Sort: Name A-Z</option>
                    <option value="name-desc">Sort: Name Z-A</option>
                    <option value="price-low">Sort: Price Low-High</option>
                    <option value="price-high">Sort: Price High-Low</option>
                    <option value="stock-high">Sort: Stock High-Low</option>
                    <option value="stock-low">Sort: Stock Low-High</option>
                  </select>
                </div>

                <div className="admin-list">
                  {visibleProducts.map((product) => (
                    <article className="admin-item" key={product._id}>
                      <img src={resolveImageUrl(product.image)} alt={product.name} />
                      <div>
                        <h3>{product.name}</h3>
                        <p>
                          {product.subCategory || product.category || "-"} | ${Number(product.price).toFixed(2)}
                        </p>
                        <p className="muted">
                          Stock: {product.stockCount ?? 0} | Colors: {(product.colors || []).join(", ") || "-"} |
                          Sizes: {(product.sizes || []).join(", ") || "-"}
                        </p>
                        <p className="muted">
                          Size Prices:{" "}
                          {Object.entries(product.sizePrices || {})
                            .map(([size, price]) => `${size}: $${Number(price).toFixed(2)}`)
                            .join(" | ") || "-"}
                        </p>
                        <p className="muted">
                          Categories: {(product.categories || product.tags || []).join(", ") || "-"}
                        </p>
                      </div>
                      <div className="admin-item-actions">
                        <button type="button" onClick={() => handleEdit(product)}>
                          Edit
                        </button>
                        <button type="button" className="danger-btn" onClick={() => handleDelete(product._id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {!visibleProducts.length ? <p className="muted">No products match current filters.</p> : null}
              </div>
            ) : null}
            </div>
            ) : null}

            {activeSection === "order-management" ||
            activeSection === "custom-requests" ||
            activeSection === "contact-messages" ? (
              <aside className="admin-orders" id="admin-orders">
            <div className="admin-head">
              <h2>
                {activeSection === "order-management"
                  ? "Orders Management"
                  : activeSection === "custom-requests"
                    ? "Custom Requests"
                    : "Contact Messages"}
              </h2>
              <button
                type="button"
                className="orders-refresh-btn"
                onClick={
                  activeSection === "order-management"
                    ? fetchOrders
                    : activeSection === "custom-requests"
                      ? fetchCustomRequests
                      : fetchContactMessages
                }
              >
                {activeSection === "order-management"
                  ? "Refresh Orders"
                  : activeSection === "custom-requests"
                    ? "Refresh Requests"
                    : "Refresh Messages"}
              </button>
            </div>
            {activeSection === "order-management" ? (
            <div className="order-stats">
              <article className="order-stat-card">
                <p>Total Orders</p>
                <strong>{orderStats.totalOrders}</strong>
              </article>
              <article className="order-stat-card">
                <p>Total Revenue</p>
                <strong>${orderStats.totalRevenue.toFixed(2)}</strong>
              </article>
            </div>
            ) : null}

            {activeSection === "order-management" ? (
            <div className="orders-insights">
              <div className="orders-top-products">
                <h3>Top 3 Most Ordered Products</h3>
                {orderInsights.topProducts.length ? (
                  <ol>
                    {orderInsights.topProducts.map((item) => (
                      <li key={item.name}>
                        <span>{item.name}</span>
                        <strong>{item.quantity}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">No product order data yet.</p>
                )}
              </div>

              <div className="orders-top-customers">
                <h3>Top 10 Customers by Orders</h3>
                {orderInsights.topCustomers.length ? (
                  <ol>
                    {orderInsights.topCustomers.map((customer) => (
                      <li key={customer.id}>
                        <div>
                          <span>{customer.name || "Unknown Customer"}</span>
                          {customer.email ? <small>{customer.email}</small> : null}
                        </div>
                        <strong>{customer.orders}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">No customer order data yet.</p>
                )}
              </div>

              <div className="orders-chart-block">
                <h3>Orders in Last 12 Months</h3>
                <div className="orders-chart">
                  {orderInsights.monthlyOrders.map((month) => {
                    const heightPct =
                      orderInsights.maxMonthlyOrders > 0
                        ? (month.count / orderInsights.maxMonthlyOrders) * 100
                        : 0;
                    return (
                      <div className="orders-chart-col" key={`${month.key}`}>
                        <div className="orders-chart-bar-wrap">
                          <div
                            className="orders-chart-bar"
                            style={{ height: `${Math.max(heightPct, month.count > 0 ? 8 : 0)}%` }}
                            title={`${month.label} ${month.year}: ${month.count} orders`}
                          />
                        </div>
                        <small>{month.label}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            ) : null}

            {activeSection === "custom-requests" ? (
            <div className="admin-custom-requests" id="admin-custom-requests">
              {customRequestLoading ? (
                <p>Loading custom requests...</p>
              ) : !customRequests.length ? (
                <p className="muted">No custom design requests yet.</p>
              ) : (
                <div className="custom-request-list">
                  {customRequests.map((request) => (
                    <article className="custom-request-card" key={request._id}>
                      <p>
                        <strong>{request.name}</strong> ({request.email})
                      </p>
                      <p className="muted">{request.phone}</p>
                      <p>
                        {request.category} | Qty: {request.quantity}
                      </p>
                      <p className="muted">
                        Deadline:{" "}
                        {request.deadline ? new Date(request.deadline).toLocaleDateString() : "Not specified"}
                      </p>
                      <p className="muted">
                        Submitted: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                      </p>
                      <p>{request.designIdea}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
            ) : null}

            {activeSection === "contact-messages" ? (
            <div className="admin-contact-messages" id="admin-contact-messages">
              {contactMessagesLoading ? (
                <p>Loading contact messages...</p>
              ) : !contactMessages.length ? (
                <p className="muted">No contact messages yet.</p>
              ) : (
                <div className="custom-request-list">
                  {contactMessages.map((item) => (
                    <article className="custom-request-card" key={item._id}>
                      <p>
                        <strong>{item.name}</strong> ({item.email})
                      </p>
                      {item.phone ? <p className="muted">{item.phone}</p> : null}
                      <p>
                        <strong>Subject:</strong> {item.subject}
                      </p>
                      <p className="muted">
                        Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                      </p>
                      <p>{item.message}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
            ) : null}

            {activeSection === "order-management" ? orderLoading ? (
              <p>Loading orders...</p>
            ) : !orders.length ? (
              <p className="muted">No orders yet.</p>
            ) : (
              <div className="admin-list">
                {orders.map((order) => (
                  <article className="admin-item" key={order._id}>
                    <div>
                      <h3>Order {order._id}</h3>
                      <p>
                        {order.user?.name || "User"} | ${Number(order.total || 0).toFixed(2)}
                      </p>
                      <p className="muted">Payment: {order.paymentStatus}</p>
                    </div>
                    <div className="admin-item-actions">
                      <select
                        value={order.orderStatus}
                        onChange={async (e) => {
                          try {
                            const response = await fetch(`${API_BASE_URL}/api/orders/${order._id}/status`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                "x-admin-key": ADMIN_API_KEY
                              },
                              body: JSON.stringify({ orderStatus: e.target.value })
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.message || "Failed to update status");
                            setOrders((prev) => prev.map((item) => (item._id === data._id ? data : item)));
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        <option value="processing">processing</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            </aside>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
