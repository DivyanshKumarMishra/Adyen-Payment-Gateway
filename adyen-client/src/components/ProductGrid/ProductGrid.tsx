import { products } from "../../data/products";
import type { Product } from "../../data/products";
import "./ProductGrid.css";

interface ProductGridProps {
  onBuy: (product: Product) => void;
}

function ProductGrid({ onBuy }: ProductGridProps) {
  return (
    <div className="product-grid-container">
      <h1 className="product-grid-title">Electronics Store</h1>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p className="price">{product.displayPrice}</p>
              <button className="buy-btn" onClick={() => onBuy(product)}>
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;
