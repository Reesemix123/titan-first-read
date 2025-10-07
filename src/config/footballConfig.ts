// src/config/footballConfig.ts
// SINGLE SOURCE OF TRUTH for all football-related attributes
// Used by: PlayBuilder, Film Analysis, Analytics, Reports

import { Player } from '@/types/football';

// ============================================
// CORE ATTRIBUTE DEFINITIONS
// ============================================

/**
 * These attributes apply to ALL plays regardless of ODK
 */
export const COMMON_ATTRIBUTES = {
  downDistance: [
    '1st & 10',
    '2nd & Short (1-3)',
    '2nd & Medium (4-7)',
    '2nd & Long (8+)',
    '3rd & Short (1-3)',
    '3rd & Medium (4-7)',
    '3rd & Long (8+)',
    '4th & Short',
    '4th & Medium',
    '4th & Long'
  ],
  
  fieldZone: [
    'Own Red Zone (0-20)',
    'Own Territory (21-49)',
    'Midfield (50)',
    'Opponent Territory (49-21)',
    'Red Zone (20-0)'
  ],
  
  hash: ['Left', 'Middle', 'Right'],
  
  gameContext: [
    '2-Minute Drill',
    'Goal Line',
    'Short Yardage',
    'Backed Up',
    'Coming Out',
    'Hurry Up',
    'Victory Formation'
  ]
} as const;

/**
 * Offensive play attributes
 */
export const OFFENSIVE_ATTRIBUTES = {
  playType: ['Run', 'Pass', 'RPO', 'Screen', 'Draw', 'Play Action'],
  
  personnel: [
    '11 (1RB-1TE-3WR)',
    '12 (1RB-2TE-2WR)',
    '21 (2RB-1TE-2WR)',
    '10 (1RB-0TE-4WR)',
    '13 (1RB-3TE-1WR)',
    '22 (2RB-2TE-1WR)',
    '00 (0RB-0TE-5WR)'
  ],
  
  runConcepts: [
    'Inside Zone',
    'Outside Zone',
    'Power',
    'Counter',
    'Trap',
    'Sweep',
    'Toss',
    'Iso',
    'Lead',
    'Dive',
    'QB Sneak',
    'QB Power',
    'QB Counter',
    'Read Option'
  ],
  
  passConcepts: [
    'Levels',
    'Flood',
    'Mesh',
    'Stick',
    'Follow',
    'Drive',
    'Sail',
    'China',
    'Smash',
    'Corner',
    'Post-Wheel',
    'Four Verticals',
    'Spacing',
    'Shallow Cross'
  ],
  
  protection: [
    '5-Man (Slide)',
    '6-Man (RB)',
    '7-Man (Max)',
    'BOB (Big on Big)',
    'Half Slide',
    'Turnback',
    'Play Action'
  ],
  
  motion: [
    'None',
    'Jet',
    'Orbit',
    'Return',
    'Fly',
    'Trade',
    'Shift',
    'Swing'
  ],
  
  targetHole: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  
  ballCarrier: ['QB', 'RB', 'FB', 'WR', 'TE']
} as const;

/**
 * Defensive play attributes
 */
export const DEFENSIVE_ATTRIBUTES = {
  front: [
    '4-3 Over',
    '4-3 Under',
    '3-4 Base',
    '3-3 Stack',
    '5-2',
    '6-1',
    '4-2-5 Nickel',
    '3-3-5',
    '2-4-5 Dime',
    'Bear'
  ],
  
  coverage: [
    'Cover 0 (Man)',
    'Cover 1 (Man Free)',
    'Cover 2',
    'Cover 3',
    'Cover 4 (Quarters)',
    'Cover 6',
    '2-Man Under',
    'Tampa 2',
    'Palms',
    'Robber'
  ],
  
  blitzType: [
    'None',
    'Inside Blitz',
    'Outside Blitz',
    'Corner Blitz',
    'Safety Blitz',
    'Double A-Gap',
    'Fire Zone',
    'Overload',
    'Green Dog'
  ],
  
  stunt: [
    'None',
    'T-E Twist',
    'E-T Games',
    'Loop',
    'Cross',
    'Pinch',
    'Slant',
    'Spike'
  ],
  
  pressLevel: ['Off', 'Soft', 'Press', 'Jam']
} as const;

/**
 * Special Teams attributes
 */
export const SPECIAL_TEAMS_ATTRIBUTES = {
  unit: [
    'Kickoff',
    'Kick Return',
    'Punt',
    'Punt Return',
    'Field Goal',
    'PAT'
  ],
  
  kickoffType: [
    'Deep Middle',
    'Deep Left',
    'Deep Right',
    'Squib',
    'Pooch',
    'Onside Left',
    'Onside Right'
  ],
  
  puntType: [
    'Standard',
    'Directional Left',
    'Directional Right',
    'Pooch',
    'Rugby',
    'Sky Punt'
  ],
  
  returnScheme: [
    'Middle Return',
    'Left Return',
    'Right Return',
    'Wall',
    'Wedge',
    'Fake'
  ]
} as const;

/**
 * Play result/outcome attributes (for film analysis)
 */
export const PLAY_RESULTS = {
  outcome: [
    'Completion',
    'Incompletion',
    'Gain',
    'No Gain',
    'Loss',
    'Touchdown',
    'Turnover (INT)',
    'Turnover (Fumble)',
    'Sack',
    'Penalty',
    'First Down'
  ],
  
  successCriteria: {
    '1st Down': 'Gain 40% of distance',
    '2nd Down': 'Gain 60% of distance',
    '3rd/4th Down': 'Gain 100% of distance'
  }
} as const;

// ============================================
// FORMATION COORDINATES (Keep existing)
// ============================================

export interface FormationConfig {
  [key: string]: Player[];
}

export const OFFENSIVE_FORMATIONS: FormationConfig = {
  'Shotgun Spread': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 380, label: 'QB' },
    { position: 'RB', x: 345, y: 380, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' },
    { position: 'SL', x: 120, y: 290, label: 'SL' }
  ],
  
  'I-Formation': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' }
  ],
  
  'Singleback': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'RB', x: 300, y: 350, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' },
    { position: 'SL', x: 120, y: 280, label: 'SL' }
  ]
  // Add more formations as needed
};

export const DEFENSIVE_FORMATIONS: FormationConfig = {
  '4-3 Base': [
    { position: 'DE1', x: 120, y: 275, label: 'DE1' },
    { position: 'DT1', x: 240, y: 275, label: 'DT1' },
    { position: 'DT2', x: 360, y: 275, label: 'DT2' },
    { position: 'DE2', x: 480, y: 275, label: 'DE2' },
    { position: 'SAM', x: 135, y: 320, label: 'SAM' },
    { position: 'MIKE', x: 300, y: 320, label: 'MIKE' },
    { position: 'WILL', x: 465, y: 320, label: 'WILL' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 300, y: 410, label: 'FS' },
    { position: 'SS', x: 480, y: 380, label: 'SS' }
  ],
  
  '3-4 Base': [
    { position: 'DE1', x: 165, y: 275, label: 'DE1' },
    { position: 'NT', x: 300, y: 275, label: 'NT' },
    { position: 'DE2', x: 435, y: 275, label: 'DE2' },
    { position: 'OLB1', x: 60, y: 320, label: 'OLB1' },
    { position: 'ILB1', x: 225, y: 320, label: 'ILB1' },
    { position: 'ILB2', x: 375, y: 320, label: 'ILB2' },
    { position: 'OLB2', x: 540, y: 320, label: 'OLB2' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 300, y: 410, label: 'FS' },
    { position: 'SS', x: 480, y: 380, label: 'SS' }
  ]
  // Add more formations as needed
};

export const SPECIAL_TEAMS_FORMATIONS: FormationConfig = {
  'Kickoff': [
    { position: 'K', x: 300, y: 140, label: 'K' },
    { position: 'L5', x: 45, y: 200, label: 'L5' },
    { position: 'L4', x: 105, y: 200, label: 'L4' },
    { position: 'L3', x: 165, y: 200, label: 'L3' },
    { position: 'L2', x: 225, y: 200, label: 'L2' },
    { position: 'L1', x: 285, y: 200, label: 'L1' },
    { position: 'R1', x: 315, y: 200, label: 'R1' },
    { position: 'R2', x: 375, y: 200, label: 'R2' },
    { position: 'R3', x: 435, y: 200, label: 'R3' },
    { position: 'R4', x: 495, y: 200, label: 'R4' },
    { position: 'R5', x: 555, y: 200, label: 'R5' }
  ]
  // Add more formations as needed
};

// ============================================
// ATTRIBUTE SCHEMA FOR DATABASE
// ============================================

/**
 * TypeScript type for play attributes stored in database
 * This structure will be stored as JSONB in playbook_plays.attributes
 */
export interface PlayAttributes {
  // Common to all plays
  odk: 'offense' | 'defense' | 'specialTeams';
  formation: string;
  downDistance?: string;
  fieldZone?: string;
  hash?: string;
  gameContext?: string[];
  customTags?: string[];
  
  // Offensive specific
  playType?: string;
  personnel?: string;
  runConcept?: string;
  passConcept?: string;
  protection?: string;
  motion?: string;
  targetHole?: string;
  ballCarrier?: string;
  
  // Defensive specific
  front?: string;
  coverage?: string;
  blitzType?: string;
  stunt?: string;
  pressLevel?: string;
  
  // Special Teams specific
  unit?: string;
  kickoffType?: string;
  puntType?: string;
  returnScheme?: string;
  
  // For film analysis
  result?: {
    outcome?: string;
    yardsGained?: number;
    isSuccess?: boolean;
    notes?: string;
  };
}

/**
 * Helper function to get all attribute options for a given ODK
 */
export function getAttributeOptions(odk: 'offense' | 'defense' | 'specialTeams') {
  const common = COMMON_ATTRIBUTES;
  
  switch (odk) {
    case 'offense':
      return {
        ...common,
        ...OFFENSIVE_ATTRIBUTES,
        formations: Object.keys(OFFENSIVE_FORMATIONS)
      };
    case 'defense':
      return {
        ...common,
        ...DEFENSIVE_ATTRIBUTES,
        formations: Object.keys(DEFENSIVE_FORMATIONS)
      };
    case 'specialTeams':
      return {
        ...common,
        ...SPECIAL_TEAMS_ATTRIBUTES,
        formations: Object.keys(SPECIAL_TEAMS_FORMATIONS)
      };
  }
}

/**
 * Helper to validate play attributes
 */
export function validatePlayAttributes(attributes: Partial<PlayAttributes>): boolean {
  if (!attributes.odk || !attributes.formation) {
    return false;
  }
  // Add more validation as needed
  return true;
}

// Export everything for use across the app
export const FOOTBALL_CONFIG = {
  common: COMMON_ATTRIBUTES,
  offensive: OFFENSIVE_ATTRIBUTES,
  defensive: DEFENSIVE_ATTRIBUTES,
  specialTeams: SPECIAL_TEAMS_ATTRIBUTES,
  results: PLAY_RESULTS,
  formations: {
    offensive: OFFENSIVE_FORMATIONS,
    defensive: DEFENSIVE_FORMATIONS,
    specialTeams: SPECIAL_TEAMS_FORMATIONS
  },
  helpers: {
    getAttributeOptions,
    validatePlayAttributes
  }
} as const;