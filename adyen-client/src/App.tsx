import { useState, useMemo } from "react";
import ProductGrid from "./components/ProductGrid/ProductGrid";
import Checkout from "./components/Checkout/Checkout";
import Login from "./components/Login/Login";
import NavBar from "./components/NavBar/NavBar";
import { useAuth } from "./context/AuthContext";
import type { Product } from "./data/products";

function getProductFromURL(): Product | null {
  const params = new URLSearchParams(window.location.search);
  const amount = params.get("amount");
  const name = params.get("name");
  const currency = params.get("currency") || "GBP";

  if (amount && name) {
    const price = parseInt(amount, 10);
    const symbol = currency === "GBP" ? "£" : currency;
    return {
      id: "url-product",
      name,
      price,
      displayPrice: `${symbol}${(price / 100).toFixed(2)}`,
      image: "",
    };
  }
  return null;
}

function App() {
  const { user, loading } = useAuth();
  const urlProduct = useMemo(() => getProductFromURL(), []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(urlProduct);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "#6b7280", fontSize: 15 }}>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <NavBar />
      {selectedProduct ? (
        <Checkout product={selectedProduct} />
      ) : (
        <ProductGrid onBuy={setSelectedProduct} />
      )}
    </>
  );
}

export default App;
