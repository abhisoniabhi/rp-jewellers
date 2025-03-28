
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EMICalculator() {
  const [amount, setAmount] = useState<string>('');
  const [months, setMonths] = useState<string>('');
  const [interest, setInterest] = useState<string>('12');
  const [emi, setEmi] = useState<number | null>(null);

  const calculateEMI = () => {
    const p = parseFloat(amount);
    const r = parseFloat(interest) / 12 / 100;
    const n = parseFloat(months);
    
    if (!isNaN(p) && !isNaN(r) && !isNaN(n)) {
      const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      setEmi(emi);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">EMI Calculator</h3>
      <div className="space-y-4">
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Number of months"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Interest rate (%)"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />
        <Button onClick={calculateEMI} className="w-full">
          Calculate EMI
        </Button>
        {emi !== null && (
          <div className="mt-4 text-center">
            <p className="text-lg">Monthly EMI:</p>
            <p className="text-2xl font-bold">₹{emi.toFixed(2)}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
