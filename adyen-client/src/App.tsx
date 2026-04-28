import { useState, useMemo } from "react";
import ProductGrid from "./components/ProductGrid/ProductGrid";
import Checkout from "./components/Checkout/Checkout";
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
  const urlProduct = useMemo(() => getProductFromURL(), []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(urlProduct);

  if (selectedProduct) {
    return (
      <Checkout product={selectedProduct} />
    );
  }

  return <ProductGrid onBuy={setSelectedProduct} />;
}

export default App;
