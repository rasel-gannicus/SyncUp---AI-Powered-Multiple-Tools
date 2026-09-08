"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { PlusCircle } from "lucide-react";
import { Transaction } from "../FinanceTracker";

interface TransactionFormProps {
  onSubmit:  any ;
  initialValues?: Omit<Transaction, 'id' | 'date'>;
  submitLabel: string;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSubmit, 
  initialValues, 
  submitLabel, 
  onCancel 
}) => {
  const [type, setType] = useState<'income' | 'expenses'>(initialValues?.type || 'income');
  const [amount, setAmount] = useState<string>(initialValues?.amount?.toString() || '');

  useEffect(() => {
    if (initialValues) {
      setType(initialValues.type);
      setAmount(initialValues.amount.toString());
    } else {
      setType('income');
      setAmount('');
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (amount && !isNaN(parsedAmount)) {
      onSubmit({ type, amount: parsedAmount });
      if (!initialValues) {
        setAmount('');
        setType('income');
      }
    }
  };

  const handleCancel = () => {
    onCancel();
    if (!initialValues) {
      setType('income');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <Select value={type} onValueChange={(value: 'income' | 'expenses') => setType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expenses">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="flex-grow"
        />
      </div>
      <div className="flex space-x-2">
        <Button type="submit" className="flex-1 bg-teal-600 ">
          <PlusCircle className="mr-2 h-4 w-4" /> {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};