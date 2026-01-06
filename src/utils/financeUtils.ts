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

  const needsSpentRaw = monthlyExpenses
    .filter((t) => t.category === 'needs')
    .reduce((sum, t) => sum + t.amount, 0);

  const wantsSpentRaw = monthlyExpenses
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

  // --- 5. CHRONOLOGICAL WATERFALL (Smart Cascade): Needs ↔ Wants → Savings ---
  // To strictly respect "first come first served" and "fill vacancy" logic.

  let currentNeedsCap = needsTarget;
  let currentWantsCap = wantsTarget;

  let needsToWants = 0;
  let needsToSavings = 0;
  let wantsToNeeds = 0;
  let wantsToSavings = 0;

  const txStatuses: Record<string, {
    usedNeeds: number;
    usedWants: number;
    usedSavings: number;
    overflowSource: 'needs' | 'wants' | null;
  }> = {};

  // Sort expenses by INSERTION ORDER (createdAt) to ensure "first come first served" logic
  // This is critical: user expects Groceries (added first) to get priority over Starbucks (added second)
  const sortedExpenses = monthlyExpenses
    .filter((t: any) => t.type === 'expense' && (t.category === 'needs' || t.category === 'wants'))
    .sort((a: any, b: any) => {
      // Primary: createdAt (supports Firestore Timestamp, Date object, or ISO string)
      const getCreatedTime = (tx: any) => {
        if (tx.createdAt?.seconds) return tx.createdAt.seconds * 1000; // Firestore Timestamp
        if (tx.createdAt instanceof Date) return tx.createdAt.getTime();
        if (tx.createdAt) return new Date(tx.createdAt).getTime();
        return 0; // No createdAt
      };
      const createdA = getCreatedTime(a);
      const createdB = getCreatedTime(b);
      if (createdA !== createdB) return createdA - createdB;
      // Fallback: date field
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  sortedExpenses.forEach((t: any) => {
    let remaining = t.amount;
    let usedNeeds = 0;
    let usedWants = 0;
    let usedSavings = 0;

    if (t.category === 'needs') {
      // 1. Fill Needs Cap
      const takeNeeds = Math.min(remaining, Math.max(0, currentNeedsCap));
      currentNeedsCap -= takeNeeds;
      remaining -= takeNeeds;
      usedNeeds += takeNeeds;

      // 2. Fill Wants Cap (Overflow)
      if (remaining > 0) {
        const takeWants = Math.min(remaining, Math.max(0, currentWantsCap));
        currentWantsCap -= takeWants;
        needsToWants += takeWants;
        remaining -= takeWants;
        usedWants += takeWants;
      }

      // 3. To Savings (Overflow)
      if (remaining > 0) {
        needsToSavings += remaining;
        usedSavings += remaining;
      }

      txStatuses[t.id] = {
        usedNeeds, usedWants, usedSavings,
        overflowSource: (usedWants > 0 || usedSavings > 0) ? 'needs' : null
      };

    } else if (t.category === 'wants') {
      // 1. Fill Wants Cap
      const takeWants = Math.min(remaining, Math.max(0, currentWantsCap));
      currentWantsCap -= takeWants;
      remaining -= takeWants;
      usedWants += takeWants;

      // 2. Fill Needs Cap (Overflow)
      if (remaining > 0) {
        const takeNeeds = Math.min(remaining, Math.max(0, currentNeedsCap));
        currentNeedsCap -= takeNeeds;
        wantsToNeeds += takeNeeds;
        remaining -= takeNeeds;
        usedNeeds += takeNeeds;
      }

      // 3. To Savings (Overflow)
      if (remaining > 0) {
        wantsToSavings += remaining;
        usedSavings += remaining;
      }

      txStatuses[t.id] = {
        usedNeeds, usedWants, usedSavings,
        overflowSource: (usedNeeds > 0 || usedSavings > 0) ? 'wants' : null
      };
    }
  });

  // Calculate totals for display
  const needsOverflow = needsToWants + needsToSavings;
  const wantsOverflow = wantsToNeeds + wantsToSavings;

  // Effective Spent = Raw + Incoming Overflow
  // Actually, visual display logic:
  // User wants Needs Display to show "Using Wants" / "Using Savings"
  // User wants Wants Display to show "Using Needs" / "Using Savings"

  // Total Overflow to Savings is sum of both
  const totalOverflowToSavings = needsToSavings + wantsToSavings;

  // Display values: capped at target for clean display of the "Budget" bar
  // But strictly, we might want to show "Filled by Neighbor"
  const needsSpentDisplay = Math.min(needsSpentRaw + wantsToNeeds, needsTarget);
  const wantsSpentDisplay = Math.min(wantsSpentRaw + needsToWants, wantsTarget);
  // Wait, if wantsToNeeds > 0, Needs appears full. 
  // needsSpentRaw might be small, but filled by wants.
  // The 'SpentRaw' is total Needs transactions. 
  // If Wants filled Needs, Needs bar should be full? 
  // Yes.

  // Track which categories are receiving overflow
  const wantsReceivedOverflow = needsToWants > 0;
  const needsReceivedOverflow = wantsToNeeds > 0; // New: Bidirectional
  const savingsReceivedOverflow = totalOverflowToSavings > 0;

  // Savings "used" = overflow that couldn't fit in Needs/Wants
  const savingsUsedByOverflow = totalOverflowToSavings;

  // --- 6. Current Wallet Balance ---
  const totalExpenses = needsSpentRaw + wantsSpentRaw;
  const currentWalletBalance = totalMonthlyIncome - totalExpenses - totalMonthlySaved;

  // Calculate Pending Savings (reduced by overflow)
  const pendingLeftoverSave = Math.max(0, leftoverTarget - monthlySavedLeftoverRealized);
  const pending20Save = Math.max(0, savingsTarget20 - monthlySaved20Realized - savingsUsedByOverflow);

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
        spent: needsSpentDisplay,
        spentRaw: needsSpentRaw,
        overflow: needsOverflow,
        overflowToWants: needsToWants,
        overflowToSavings: needsToSavings,
        receivedOverflow: needsReceivedOverflow, // New
        remaining: Math.max(0, needsTarget - (needsSpentRaw + wantsToNeeds)),
        percentage: needsTarget > 0 ? (needsSpentDisplay / needsTarget) * 100 : 0
      },
      wants: {
        target: wantsTarget,
        spent: wantsSpentDisplay,
        spentRaw: wantsSpentRaw,
        overflow: wantsOverflow,
        overflowToNeeds: wantsToNeeds,
        overflowToSavings: wantsToSavings,
        receivedOverflow: wantsReceivedOverflow,
        remaining: Math.max(0, wantsTarget - (wantsSpentRaw + needsToWants)),
        percentage: wantsTarget > 0 ? (wantsSpentDisplay / wantsTarget) * 100 : 0
      },
      savings20: {
        target: savingsTarget20,
        saved: monthlySaved20Realized,
        usedByOverflow: savingsUsedByOverflow,
        pending: pending20Save,
        percentage: savingsTarget20 > 0 ? ((monthlySaved20Realized + savingsUsedByOverflow) / savingsTarget20) * 100 : 0
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
      totalExpenses: totalExpenses,
      needsSpent: needsSpentRaw,
      wantsSpent: wantsSpentRaw,
      wantsReceivedOverflow,
      needsReceivedOverflow,
      savingsReceivedOverflow,
      displayBalance: displayBalance,
      walletBalance: currentWalletBalance,
      txStatuses // PASS THIS TO UI
    }
  };
};

// NEW FUNCTION: Calculate stats for all months (for historical context)
export const calculateAllMonthlyStats = (transactions: any[], userProfile?: any) => {
  const months = Array.from(new Set(transactions.map(t => getMonthKey(t.date))));
  const monthlyStats: any = {};

  months.forEach(monthKey => {
    const monthTransactions = transactions.filter(t => getMonthKey(t.date) === monthKey);

    const income = monthTransactions
      .filter(t => t.type === 'income' && !t.isCarriedOver)
      .reduce((sum, t) => sum + t.amount, 0);

    const needs = monthTransactions
      .filter(t => t.type === 'expense' && t.category === 'needs')
      .reduce((sum, t) => sum + t.amount, 0);

    const wants = monthTransactions
      .filter(t => t.type === 'expense' && t.category === 'wants')
      .reduce((sum, t) => sum + t.amount, 0);

    const saved = monthTransactions
      .filter(t => t.type === 'expense' && t.category === 'savings')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyStats[monthKey] = { income, needs, wants, saved };
  });

  return monthlyStats;
};

// NEW FUNCTION: Format historical data for RAG
export const formatHistoricalRAG = (allStats: any) => {
  let output = "\n--- HISTORICAL SPENDING SUMMARY ---\n";
  const sortedMonths = Object.keys(allStats).sort().reverse(); // Show latest first

  sortedMonths.forEach(month => {
    const s = allStats[month];
    output += `${month}: Inc RM${s.income.toFixed(0)}, Needs RM${s.needs.toFixed(0)}, Wants RM${s.wants.toFixed(0)}, Saved RM${s.saved.toFixed(0)}\n`;
  });

  return output.trim();
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