// src/constants/avatars.ts

export const BEAR_AVATARS: { [key: string]: any } = {
    'bear_level_1': require('../../assets/avatars/bear_level_1.png'),
    'bear_level_2': require('../../assets/avatars/bear_level_2.png'),
    'bear_level_3': require('../../assets/avatars/bear_level_3.png'),
    'bear_level_4': require('../../assets/avatars/bear_level_4.png'),
    'bear_level_5': require('../../assets/avatars/bear_level_5.png'),
    'bear_level_6': require('../../assets/avatars/bear_level_6.png'),
    'bear_level_7': require('../../assets/avatars/bear_level_7.png'),
    'bear_level_8': require('../../assets/avatars/bear_level_8.png'),
    'bear_level_9': require('../../assets/avatars/bear_level_9.png'),
    'bear_level_10': require('../../assets/avatars/bear_level_10.png'),
    'bear_level_11': require('../../assets/avatars/bear_level_11.png'),
    'bear_level_12': require('../../assets/avatars/bear_level_12.png'),
    'bear_level_13': require('../../assets/avatars/bear_level_13.png'),
};

export const DEFAULT_AVATARS = [
    'bear',
    'cat',
    'dog',
    'rabbit',
    'panda',
    'koala',
    'account',
    'account-circle',
    'face-man-profile',
    'face-woman-profile',
    'alien',
    'robot-happy',
    'ghost',
    'rocket',
    'star',
    'heart',
];

export const isBearAvatar = (avatar: string) => avatar.startsWith('bear_level_');
