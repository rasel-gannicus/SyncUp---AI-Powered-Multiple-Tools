"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { DollarSign, Edit, Trash2 } from "lucide-react";
import Chart from "./Chart/Chart";
import { useAppSelector } from "@/Redux/hooks"; 
import { StatCard } from "./Stat Card/StatCard";
import { TransactionForm } from "./Add Transaction Form/TransactionForm";
import { useOptimisticAddTransaction } from "./hooks/useOptimisticAddTransaction";
import { useOptimisticDeleteTransaction } from "./hooks/useOptimisticDeleteTransaction";
import { useOptimisticEditTransaction } from "./hooks/useOptimisticEditTransaction";
import dollarImg from "@/assets/img/money.png";
import dollarImg2 from "@/assets/img/money2.png";
import Image from "next/image";
import { HabitTrackerLoading } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import { useAuthState } from "@/utils/Route Protection/useAuthState";

export interface Transaction {
  id: string;
  type: "income" | "expenses";
  amount: number;
  date: string;
}

interface FinanceTracker {
  name: string;
  income: number;
  expenses: number;
  savings: number;
  transactions: Transaction[];
}

const FinanceTracker: React.FC = () => {
  const userState = useAppSelector((state) => state.user);
  const { user: userData, userLoading } = userState;
  const email = userData?.email;

  const { user, loading } = useAuthState();

  const [data, setData] = useState<FinanceTracker[]>(
    userData?.financeTracker || []
  );
  const [editingTransaction, setEditingTransaction]: any =
    useState<Transaction | null>(null);

  const cancelEdit = () => {
    setEditingTransaction(null);
  };

  const latestMonth = data[data.length - 1] || {
    name: "",
    income: 0,
    expenses: 0,
    savings: 0,
    transactions: [],
  };
  const prevMonth = data[data.length - 2] || {
    income: 0,
    expenses: 0,
    savings: 0,
  };

  useEffect(() => {
    if (userData?.financeTracker) {
      setData(userData.financeTracker);
    }
  }, [userData]);

  const calculateTrend = (current: number, previous: number): number => {
    return previous === 0
      ? 0
      : Number((((current - previous) / previous) * 100).toFixed(2));
  };

  const handleAddTransaction = useOptimisticAddTransaction(email, setData);

  const handleEditTransaction = useOptimisticEditTransaction(
    email,
    data,
    setData,
    cancelEdit
  );

  const handleRemoveTransaction = useOptimisticDeleteTransaction(
    email,
    setData
  );

  const formatedDate = (date: string) => {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return dateObj.toLocaleDateString(undefined, options);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-3xl font-bold mb-4">Finance Tracker</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={latestMonth.income}
          trend={calculateTrend(latestMonth.income, prevMonth.income)}
          icon={DollarSign}
          userLoading={userLoading}
        />
        <StatCard
          title="Total Expenses"
          value={latestMonth.expenses}
          trend={calculateTrend(latestMonth.expenses, prevMonth.expenses)}
          icon={DollarSign}
          userLoading={userLoading}
        />
        <StatCard
          title="Total Savings"
          value={latestMonth.savings}
          trend={calculateTrend(latestMonth.savings, prevMonth.savings)}
          icon={DollarSign}
          userLoading={userLoading}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            onSubmit={
              editingTransaction
                ? (updatedTransaction: any) =>
                    handleEditTransaction(
                      editingTransaction?._id,
                      updatedTransaction as Transaction
                    )
                : handleAddTransaction
            }
            initialValues={editingTransaction || undefined}
            submitLabel={
              editingTransaction ? "Update Transaction" : "Add Transaction"
            }
            onCancel={cancelEdit}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          { !user || latestMonth.transactions.length === 0 ? (
            <p>No transactions yet. Add a transaction to get started!</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto ">
              {userLoading ? (
                <HabitTrackerLoading />
              ) : (
                latestMonth.transactions.map((transaction: any) => (
                  <li
                    key={transaction._id}
                    className={`flex items-center justify-between p-2 dark:text-gray-100 bg-gray-100 dark:bg-gray-500 rounded ${
                      transaction.type === "income"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <span className="flex items-center">
                      {transaction.type === "income" ? "➕" : "➖"}
                      <span className="flex items-center gap-1 ms-5">
                        {/* <AiFillDollarCircle className="text-orange-400" /> */}
                        <Image
                          src={
                            transaction.type === "income"
                              ? dollarImg
                              : dollarImg2
                          }
                          alt="dollar"
                          width={30}
                        />
                        {transaction.amount}
                      </span>
                    </span>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs lg:me-20 hidden md:block"
                      >
                        {formatedDate(transaction.date)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTransaction(transaction._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </CardContent>
      </Card>
      <Chart data={data} />
    </div>
  );
};

export default FinanceTracker;
