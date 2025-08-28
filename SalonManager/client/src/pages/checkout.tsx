import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Item {
  name: string;
  price: number;
  image: string;
}

const items: Item[] = [
  { name: "Haircut", price: 50, image: "https://picsum.photos/seed/haircut/200" },
  { name: "Coloring", price: 80, image: "https://picsum.photos/seed/coloring/200" },
  { name: "Styling", price: 40, image: "https://picsum.photos/seed/styling/200" },
  { name: "Manicure", price: 30, image: "https://picsum.photos/seed/manicure/200" },
  { name: "Pedicure", price: 40, image: "https://picsum.photos/seed/pedicure/200" },
  { name: "Facial", price: 60, image: "https://picsum.photos/seed/facial/200" },
  { name: "Massage", price: 70, image: "https://picsum.photos/seed/massage/200" },
  { name: "Waxing", price: 25, image: "https://picsum.photos/seed/waxing/200" },
  { name: "Hair Treatment", price: 55, image: "https://picsum.photos/seed/treatment/200" },
  { name: "Makeup", price: 45, image: "https://picsum.photos/seed/makeup/200" },
  { name: "Product A", price: 20, image: "https://picsum.photos/seed/producta/200" },
  { name: "Product B", price: 25, image: "https://picsum.photos/seed/productb/200" },
];

export default function Checkout() {
  const [cart, setCart] = useState<Record<string, number>>({});

  const addItem = (item: Item) => {
    setCart((prev) => ({ ...prev, [item.name]: (prev[item.name] || 0) + 1 }));
  };

  const changeQty = (name: string, delta: number) => {
    setCart((prev) => {
      const current = prev[name] || 0;
      const next = current + delta;
      const copy = { ...prev };
      if (next <= 0) {
        delete copy[name];
      } else {
        copy[name] = next;
      }
      return copy;
    });
  };

  const total = items.reduce((sum, item) => sum + (cart[item.name] || 0) * item.price, 0);
  const today = new Date().toLocaleDateString("de-DE");

  return (
    <div className="min-h-screen flex flex-col bg-app text-on">
      <header className="flex items-center p-4 pb-2 justify-between">
        <h2 className="text-lg font-bold flex-1 text-center">Salon Elegance</h2>
        <div className="w-24 text-right text-sm font-bold text-muted-foreground">{today}</div>
      </header>

      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Products & Services</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
        {items.map((item) => (
          <Card
            key={item.name}
            className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-muted"
            onClick={() => addItem(item)}
          >
            <div
              className="bg-center bg-cover rounded-lg w-10 h-10"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">${item.price}</p>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Shopping Cart</h2>
      <div className="flex flex-col">
        {Object.entries(cart).map(([name, qty]) => {
          const item = items.find((i) => i.name === name)!;
          return (
            <div
              key={name}
              className="flex items-center gap-4 px-4 py-2 justify-between border-b border-border"
            >
              <div className="flex flex-col">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changeQty(name, -1)}
                >
                  -
                </Button>
                <span className="w-4 text-center">{qty}</span>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => changeQty(name, 1)}
                >
                  +
                </Button>
              </div>
            </div>
          );
        })}
        {Object.keys(cart).length === 0 && (
          <p className="px-4 py-2 text-sm text-muted-foreground">Cart is empty</p>
        )}
      </div>

      <h2 className="text-[22px] font-bold px-4 pb-3 pt-5">Total: ${total}</h2>
      <div className="flex justify-center pb-6">
        <div className="flex flex-1 max-w-[480px] flex-col gap-3 px-4">
          <Button className="w-full bg-gold-500 text-black">Cash Payment</Button>
          <Button variant="secondary" className="w-full">Card Payment</Button>
          <Button variant="ghost" className="w-full">Send Invoice</Button>
        </div>
      </div>
    </div>
  );
}

