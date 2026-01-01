// src/utils/financeUtils.ts

export const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const calculateMonthlyStats = (transactions: any[], userProfile?: any) => {
  const currentDate = new Date();
  const currentMonthKey = getMonthKey(currentDate.toISOString().split('T')[0]);

  // --- 1. Income ---
  const allMonthlyIncomeTrans = transactions.filter(
    (t) => t.type === 'income' && getMonthKey(t.date) === currentMonthKey
  );

  const freshMonthlyIncome = allMonthlyIncomeTrans
    .filter((t) => !t.isCarriedOver)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlyIncome = allMonthlyIncomeTrans.reduce((sum, t) => sum + t.amount, 0);

  // --- 2. Expenses (Needs & Wants) ---
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
  );

  const needsSpent = monthlyExpenses
    .filter((t) => t.category === 'needs')
    .reduce((sum, t) => sum + t.amount, 0);

  const wantsSpent = monthlyExpenses
    .filter((t) => t.category === 'wants')
    .reduce((sum, t) => sum + t.amount, 0);

  // --- 3. Savings (Targets vs Realized) ---
  const savingsTarget20 = freshMonthlyIncome * 0.2;

  // Deriving leftoverTarget from transactions instead of profile
  const leftoverTarget = allMonthlyIncomeTrans
    .filter((t) => t.isCarriedOver)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySaved20Realized = monthlyExpenses
    .filter((t) => t.category === 'savings' && t.name === 'Monthly Savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavedLeftoverRealized = monthlyExpenses
    .filter((t) => t.category === 'savings' && t.name === 'Saving Leftover Balance')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlySaved = monthlySaved20Realized + monthlySavedLeftoverRealized;

  const totalSavedAllTime = transactions
    .filter((t) => t.type === 'expense' && t.category === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  // --- 4. Budget Targets (50/30/20) ---
  const needsTarget = freshMonthlyIncome * 0.5;
  const wantsTarget = freshMonthlyIncome * 0.3;

  // --- 5. Current Wallet Balance ---
  const totalExpenses = needsSpent + wantsSpent;
  const currentWalletBalance = totalMonthlyIncome - totalExpenses - totalMonthlySaved;

  // Calculate Pending Savings
  const pendingLeftoverSave = Math.max(0, leftoverTarget - monthlySavedLeftoverRealized);
  const pending20Save = Math.max(0, savingsTarget20 - monthlySaved20Realized);

  const displayBalance = currentWalletBalance - pendingLeftoverSave;

  return {
    month: currentMonthKey,
    income: {
      fresh: freshMonthlyIncome,
      total: totalMonthlyIncome
    },
    budget: {
      needs: {
        target: needsTarget,
        spent: needsSpent,
        remaining: needsTarget - needsSpent,
        percentage: needsTarget > 0 ? (needsSpent / needsTarget) * 100 : 0
      },
      wants: {
        target: wantsTarget,
        spent: wantsSpent,
        remaining: wantsTarget - wantsSpent,
        percentage: wantsTarget > 0 ? (wantsSpent / wantsTarget) * 100 : 0
      },
      savings20: {
        target: savingsTarget20,
        saved: monthlySaved20Realized,
        pending: pending20Save,
        percentage: savingsTarget20 > 0 ? (monthlySaved20Realized / savingsTarget20) * 100 : 0
      },
      leftover: {
        target: leftoverTarget,
        saved: monthlySavedLeftoverRealized,
        pending: pendingLeftoverSave,
        percentage: leftoverTarget > 0 ? (monthlySavedLeftoverRealized / leftoverTarget) * 100 : 0
      }
    },
    totals: {
      savedThisMonth: totalMonthlySaved,
      savedAllTime: totalSavedAllTime,
      walletBalance: currentWalletBalance,
      displayBalance: displayBalance,
      totalExpenses: totalExpenses,
      needsSpent,
      wantsSpent
    }
  };
};

// NEW FUNCTION: Format budget data for RAG context
export const formatBudgetForRAG = (budgetData: any) => {
  if (!budgetData) return '';

  return `
--- CURRENT MONTH BUDGET BREAKDOWN (50/30/20) ---
Month: ${budgetData.month}
Total Income: RM ${budgetData.income.fresh.toFixed(2)}

BUDGET ALLOCATIONS:
- Needs (50%): RM ${budgetData.budget.needs.target.toFixed(2)} allocated
  • Spent: RM ${budgetData.budget.needs.spent.toFixed(2)}
  • Remaining: RM ${budgetData.budget.needs.remaining.toFixed(2)}
  • ${budgetData.budget.needs.percentage.toFixed(0)}% of budget used

- Wants (30%): RM ${budgetData.budget.wants.target.toFixed(2)} allocated
  • Spent: RM ${budgetData.budget.wants.spent.toFixed(2)}
  • Remaining: RM ${budgetData.budget.wants.remaining.toFixed(2)}
  • ${budgetData.budget.wants.percentage.toFixed(0)}% of budget used

- Savings (20%): RM ${budgetData.budget.savings20.target.toFixed(2)} target
  • Saved: RM ${budgetData.budget.savings20.saved.toFixed(2)}
  • Remaining to save: RM ${budgetData.budget.savings20.pending.toFixed(2)}
  • ${budgetData.budget.savings20.percentage.toFixed(0)}% of target achieved

LEFTOVER BALANCE SAVINGS:
- Target: RM ${budgetData.budget.leftover.target.toFixed(2)}
- Saved: RM ${budgetData.budget.leftover.saved.toFixed(2)}
- Remaining: RM ${budgetData.budget.leftover.pending.toFixed(2)}
- ${budgetData.budget.leftover.percentage.toFixed(0)}% of target achieved

TOTALS:
- Total Saved This Month: RM ${budgetData.totals.savedThisMonth.toFixed(2)}
- Total Saved All Time: RM ${budgetData.totals.savedAllTime.toFixed(2)}
- Total Needs Spent: RM ${budgetData.totals.needsSpent.toFixed(2)}
- Total Wants Spent: RM ${budgetData.totals.wantsSpent.toFixed(2)}
- Current Available Balance: RM ${budgetData.totals.displayBalance.toFixed(2)}
`.trim();
};

// NEW FUNCTION: Calculate savings progress for SavingsScreen
export const calculateSavingsProgress = (transactions: any[], userProfile?: any) => {
  const budgetData = calculateMonthlyStats(transactions, userProfile);

  return {
    monthlyIncome: budgetData.income.fresh,
    targetSavings20Percent: budgetData.budget.savings20.target,
    monthlySaved20Percent: budgetData.budget.savings20.saved,
    monthlySavedLeftover: budgetData.budget.leftover.saved,
    totalMonthlySaved: budgetData.totals.savedThisMonth,
    totalSavedAllTime: budgetData.totals.savedAllTime,
    remainingToSave20Percent: budgetData.budget.savings20.pending,
    remainingToSaveLeftover: budgetData.budget.leftover.pending,
    savingsPercentage20: budgetData.budget.savings20.percentage,
    monthlyBalance: budgetData.totals.walletBalance
  };
};