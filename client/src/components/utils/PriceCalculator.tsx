
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PriceCalculatorProps {
  currentGoldRate: number;
  currentSilverRate: number;
}

export function PriceCalculator({ currentGoldRate, currentSilverRate }: PriceCalculatorProps) {
  const [weight, setWeight] = useState<string>('');
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [result, setResult] = useState<number | null>(null);

  const calculatePrice = () => {
    const weightNum = parseFloat(weight);
    if (!isNaN(weightNum)) {
      const rate = metal === 'gold' ? currentGoldRate : currentSilverRate;
      setResult(weightNum * rate);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Price Calculator</h3>
      <div className="space-y-4">
        <div>
          <select 
            className="w-full p-2 border rounded"
            value={metal}
            onChange={(e) => setMetal(e.target.value as 'gold' | 'silver')}
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
          </select>
        </div>
        <div>
          <Input
            type="number"
            placeholder="Enter weight (grams)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <Button onClick={calculatePrice} className="w-full">
          Calculate
        </Button>
        {result !== null && (
          <div className="mt-4 text-center">
            <p className="text-lg">Estimated Price:</p>
            <p className="text-2xl font-bold">₹{result.toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
