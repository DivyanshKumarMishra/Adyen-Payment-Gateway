export interface Product {
  id: string;
  name: string;
  price: number; // in pence (minor units)
  displayPrice: string;
  image: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 7999,
    displayPrice: "£79.99",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    name: "iPhone 16 Pro",
    price: 99900,
    displayPrice: "£999.00",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    name: "Wireless Earbuds",
    price: 4999,
    displayPrice: "£49.99",
    image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
  },
  {
    id: "4",
    name: 'MacBook Pro 14"',
    price: 199900,
    displayPrice: "£1,999.00",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
  },
  {
    id: "5",
    name: "Samsung Galaxy S24",
    price: 79900,
    displayPrice: "£799.00",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
  },
  {
    id: "6",
    name: "Gaming Laptop",
    price: 129900,
    displayPrice: "£1,299.00",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
  },
  {
    id: "7",
    name: "Smart Watch",
    price: 34999,
    displayPrice: "£349.99",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  },
  {
    id: "8",
    name: "Bluetooth Speaker",
    price: 5999,
    displayPrice: "£59.99",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
  },
];
