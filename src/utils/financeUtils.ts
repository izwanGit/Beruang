// src/utils/financeUtils.ts

export const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const calculateMonthlyStats = (transactions: any[], userProfile: any) => {
  const currentDate = new Date();
  const currentMonthKey = getMonthKey(currentDate.toISOString().split('T')[0]);

  // --- 1. Income ---
  // Filter income for this month (excluding carried over income from previous months if you track that via flag)
  const allMonthlyIncomeTrans = transactions.filter(
    (t) => t.type === 'income' && getMonthKey(t.date) === currentMonthKey
  );
  
  // Assuming 'isCarriedOver' flag distinguishes fresh income from transfers
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
  
  // A. 20% Rule Target (Based on Fresh Income)
  const savingsTarget20 = freshMonthlyIncome * 0.2;
  
  // B. Leftover Target (From User Profile - Last Month's Balance)
  const leftoverTarget = userProfile?.allocatedSavingsTarget || 0;

  // C. Realized Savings (Actually moved to savings this month)
  const monthlySaved20Realized = monthlyExpenses
    .filter((t) => t.category === 'savings' && t.name === 'Monthly Savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavedLeftoverRealized = monthlyExpenses
    .filter((t) => t.category === 'savings' && t.name === 'Saving Leftover Balance')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlySaved = monthlySaved20Realized + monthlySavedLeftoverRealized;

  // D. Total All Time Saved
  const totalSavedAllTime = transactions
    .filter((t) => t.type === 'expense' && t.category === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  // --- 4. Budget Targets (50/30/20) ---
  const needsTarget = freshMonthlyIncome * 0.5;
  const wantsTarget = freshMonthlyIncome * 0.3;

  // --- 5. Current Wallet Balance ---
  // Formula: Total Income - Needs - Wants - Realized Savings
  // Note: We subtract realized savings because that money leaves the "Wallet"
  const totalExpenses = needsSpent + wantsSpent;
  const currentWalletBalance = totalMonthlyIncome - totalExpenses - totalMonthlySaved;

  // Calculate Pending Savings (Money sitting in balance waiting to be saved)
  const pendingLeftoverSave = Math.max(0, leftoverTarget - monthlySavedLeftoverRealized);
  const pending20Save = Math.max(0, savingsTarget20 - monthlySaved20Realized);
  
  // "Display Balance" usually subtracts the pending leftover amount to show true spendable cash
  const displayBalance = currentWalletBalance - pendingLeftoverSave;

  return {
    month: currentMonthKey,
    income: {
      fresh: freshMonthlyIncome,
      total: totalMonthlyIncome
    },
    budget: {
      needs: { target: needsTarget, spent: needsSpent, remaining: needsTarget - needsSpent },
      wants: { target: wantsTarget, spent: wantsSpent, remaining: wantsTarget - wantsSpent },
      savings20: { target: savingsTarget20, saved: monthlySaved20Realized, pending: pending20Save },
      leftover: { target: leftoverTarget, saved: monthlySavedLeftoverRealized, pending: pendingLeftoverSave }
    },
    totals: {
      savedThisMonth: totalMonthlySaved,
      savedAllTime: totalSavedAllTime,
      walletBalance: currentWalletBalance,
      displayBalance: displayBalance
    }
  };
};