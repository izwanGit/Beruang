// src/utils/gamificationUtils.ts

export const XP_PER_LEVEL = 500;
export const MAX_LEVEL = 13;

/**
 * Calculates the current level based on total XP.
 * @param totalXP The user's total accumulated XP.
 * @returns The level number (1-13).
 */
export const calculateLevel = (totalXP: number): number => {
    // Floor XP at 0 conceptually for level calculation
    const effectiveXP = Math.max(0, totalXP);
    const level = Math.floor(effectiveXP / XP_PER_LEVEL) + 1;
    return Math.min(level, MAX_LEVEL);
};

/**
 * Calculates the XP progress within the current level.
 * @param totalXP The user's total accumulated XP.
 * @returns An object with current level XP and goal XP.
 */
export const calculateLevelProgress = (totalXP: number) => {
    const level = calculateLevel(totalXP);
    if (level >= MAX_LEVEL) {
        return {
            currentLevelXP: XP_PER_LEVEL,
            goalXP: XP_PER_LEVEL,
            percentage: 100,
        };
    }

    const currentLevelXP = totalXP % XP_PER_LEVEL;
    return {
        currentLevelXP,
        goalXP: XP_PER_LEVEL,
        percentage: (currentLevelXP / XP_PER_LEVEL) * 100,
    };
};

/**
 * Returns the correct bear avatar key for the current level.
 * @param level Current level (1-13).
 * @returns The key for BEAR_AVATARS (e.g. 'bear_level_4').
 */
export const getAvatarForLevel = (level: number): string => {
    return `bear_level_${Math.min(level, MAX_LEVEL)}`;
};

/**
 * XP Reward constants
 */
export const XP_REWARDS = {
    TRANSACTION_LOGGED: 50,
    SAVING_RM1: 2, // 2 XP per RM 1 saved
    CHAT_SESSION: 100,
    DAILY_CHECKIN: 20,
    OVERSPENDING_PENALTY: -200, // Legacy, kept for reference
    CATEGORY_OVERFLOW_PENALTY: -250, // Half level loss (Needs <-> Wants)
    SAVINGS_DIP_PENALTY: -500, // Full level loss (Touched Savings)
};
