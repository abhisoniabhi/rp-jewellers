
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StockCalculator() {
  const [items, setItems] = useState([{ weight: '', rate: '' }]);
  const [totalValue, setTotalValue] = useState<number | null>(null);

  const addItem = () => {
    setItems([...items, { weight: '', rate: '' }]);
  };

  const updateItem = (index: number, field: 'weight' | 'rate', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      const weight = parseFloat(item.weight);
      const rate = parseFloat(item.rate);
      return sum + (isNaN(weight) || isNaN(rate) ? 0 : weight * rate);
    }, 0);
    setTotalValue(total);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Stock Value Calculator</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="number"
              placeholder="Weight (g)"
              value={item.weight}
              onChange={(e) => updateItem(index, 'weight', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Rate/g"
              value={item.rate}
              onChange={(e) => updateItem(index, 'rate', e.target.value)}
            />
          </div>
        ))}
        <Button onClick={addItem} variant="outline" className="w-full">Add Item</Button>
        <Button onClick={calculateTotal} className="w-full">Calculate Total</Button>
        {totalValue !== null && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Stock Value:</p>
            <p className="text-2xl font-bold text-amber-600">₹{totalValue.toFixed(2)}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
