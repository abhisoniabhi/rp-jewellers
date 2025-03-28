
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MarginCalculator() {
  const [wholesalePrice, setWholesalePrice] = useState<string>('');
  const [markup, setMarkup] = useState<string>('');
  const [result, setResult] = useState<{retail: number, margin: number} | null>(null);

  const calculateMargin = () => {
    const cost = parseFloat(wholesalePrice);
    const markupPercent = parseFloat(markup);
    
    if (!isNaN(cost) && !isNaN(markupPercent)) {
      const retailPrice = cost * (1 + markupPercent/100);
      const marginAmount = retailPrice - cost;
      setResult({
        retail: retailPrice,
        margin: marginAmount
      });
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Margin Calculator</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Wholesale Price (₹)</label>
          <Input
            type="number"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Markup (%)</label>
          <Input
            type="number"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
          />
        </div>
        <Button onClick={calculateMargin} className="w-full">Calculate</Button>
        {result && (
          <div className="mt-4 space-y-2">
            <div className="text-center">
              <p className="text-sm text-gray-600">Retail Price:</p>
              <p className="text-xl font-bold text-green-600">₹{result.retail.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Margin Amount:</p>
              <p className="text-xl font-bold text-amber-600">₹{result.margin.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
