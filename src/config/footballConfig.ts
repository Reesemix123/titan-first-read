// src/config/footballConfig.ts
// SINGLE SOURCE OF TRUTH for all football-related attributes
// Used by: PlayBuilder, Film Analysis, Analytics, Reports
// ALL FORMATIONS VALIDATED AGAINST footballRules.ts

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
// ROUTE & ASSIGNMENT CONFIGURATION
// ============================================

/**
 * Blocking assignments for offensive linemen
 */
export const BLOCKING_ASSIGNMENTS = [
  'Man',
  'Zone',
  'Combo',
  'Pull',
  'Down',
  'Reach',
  'Scoop',
  'Pass Pro',
  'Slide Left',
  'Slide Right'
] as const;

/**
 * Running holes (gap numbering)
 */
export const RUNNING_HOLES = [
  '0 (A-Gap Right)',
  '1 (A-Gap Left)', 
  '2 (B-Gap Left)',
  '3 (B-Gap Right)',
  '4 (C-Gap Left)',
  '5 (C-Gap Right)',
  '6 (D-Gap Left)',
  '7 (D-Gap Right)',
  '8 (Off Tackle Left)',
  '9 (Off Tackle Right)'
] as const;

/**
 * Standard high school passing routes
 */
export const PASSING_ROUTES = [
  'Go/Streak/9',
  'Post',
  'Corner',
  'Comeback',
  'Curl',
  'Out',
  'In/Dig',
  'Slant',
  'Hitch',
  'Stick',
  'Flat',
  'Wheel',
  'Swing',
  'Bubble Screen',
  'Shallow Cross',
  'Deep Cross',
  'Seam',
  'Fade',
  'Block'
] as const;

/**
 * Running back routes/assignments
 */
export const RB_ASSIGNMENTS = [
  // Run plays
  '0 (A-Gap Right)',
  '1 (A-Gap Left)',
  '2 (B-Gap Left)',
  '3 (B-Gap Right)',
  '4 (C-Gap Left)',
  '5 (C-Gap Right)',
  '6 (D-Gap Left)',
  '7 (D-Gap Right)',
  '8 (Off Tackle Left)',
  '9 (Off Tackle Right)',
  // Pass plays
  'Pass Pro',
  'Swing',
  'Wheel',
  'Flat',
  'Angle',
  'Seam',
  'Screen',
  'Chip & Release'
] as const;

/**
 * Position group categorization
 */
export const POSITION_GROUPS = {
  linemen: ['LT', 'LG', 'C', 'RG', 'RT'],
  backs: ['QB', 'RB', 'FB', 'TB', 'SB'],
  receivers: ['WR', 'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'X', 'Y', 'Z', 'SL', 'SR', 'TE', 'TE1', 'TE2', 'SE', 'FL', 'WB']
} as const;

// ============================================
// ACCURATE OFFENSIVE FORMATIONS
// Field dimensions: 700x400, Line of scrimmage at y=200
// ALL OFFENSIVE PLAYERS: y >= 200 (at or behind LOS)
// ============================================

export interface FormationConfig {
  [key: string]: Player[];
}

export const OFFENSIVE_FORMATIONS: FormationConfig = {
  // ========== SHOTGUN FORMATIONS ==========
  
  'Shotgun Spread': [
    // Offensive Line (7 players on LOS = y=200)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'TE', x: 420, y: 200, label: 'TE' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    // Backfield (4 players behind LOS)
    { position: 'QB', x: 300, y: 260, label: 'QB' },
    { position: 'RB', x: 340, y: 260, label: 'RB' },
    { position: 'Z', x: 550, y: 210, label: 'Z' },
    { position: 'SL', x: 180, y: 210, label: 'SL' }
  ],
  
  'Gun Trips Right': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    { position: 'Y', x: 460, y: 200, label: 'Y' },
    // Backfield (4 behind LOS)
    { position: 'QB', x: 300, y: 260, label: 'QB' },
    { position: 'RB', x: 260, y: 260, label: 'RB' },
    { position: 'Z', x: 510, y: 210, label: 'Z' },
    { position: 'SL', x: 420, y: 215, label: 'SL' }
  ],
  
  'Gun Trips Left': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'Z', x: 550, y: 200, label: 'Z' },
    { position: 'Y', x: 140, y: 200, label: 'Y' },
    // Backfield (4 behind LOS)
    { position: 'QB', x: 300, y: 260, label: 'QB' },
    { position: 'RB', x: 340, y: 260, label: 'RB' },
    { position: 'X', x: 90, y: 210, label: 'X' },
    { position: 'SL', x: 180, y: 215, label: 'SL' }
  ],
  
  'Gun Empty': [
    // Offensive Line (5 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    { position: 'Z', x: 550, y: 200, label: 'Z' },
    // Backfield (4 behind - all receivers spread)
    { position: 'QB', x: 300, y: 260, label: 'QB' },
    { position: 'Y', x: 180, y: 210, label: 'Y' },
    { position: 'SL', x: 420, y: 210, label: 'SL' },
    { position: 'RB', x: 300, y: 230, label: 'RB' }
  ],
  
  // ========== UNDER CENTER FORMATIONS ==========
  
  'I-Formation': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'TE', x: 420, y: 200, label: 'TE' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    // Backfield (4 behind)
    { position: 'QB', x: 300, y: 215, label: 'QB' },
    { position: 'FB', x: 300, y: 245, label: 'FB' },
    { position: 'RB', x: 300, y: 280, label: 'RB' },
    { position: 'Z', x: 550, y: 210, label: 'Z' }
  ],
  
  'Singleback': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'TE', x: 420, y: 200, label: 'TE' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    // Backfield (4 behind)
    { position: 'QB', x: 300, y: 215, label: 'QB' },
    { position: 'RB', x: 300, y: 255, label: 'RB' },
    { position: 'Z', x: 550, y: 210, label: 'Z' },
    { position: 'SL', x: 180, y: 210, label: 'SL' }
  ],
  
  'Pro Set': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'TE', x: 420, y: 200, label: 'TE' },
    { position: 'X', x: 50, y: 200, label: 'X' },
    // Backfield (4 behind)
    { position: 'QB', x: 300, y: 215, label: 'QB' },
    { position: 'FB', x: 270, y: 245, label: 'FB' },
    { position: 'RB', x: 330, y: 245, label: 'RB' },
    { position: 'Z', x: 550, y: 210, label: 'Z' }
  ],
  
  'Wing-T': [
    // Offensive Line (7 on LOS)
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'C', x: 300, y: 200, label: 'C' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    { position: 'TE', x: 420, y: 200, label: 'TE' },
    { position: 'SE', x: 50, y: 200, label: 'SE' },
    // Backfield (4 behind)
    { position: 'QB', x: 300, y: 215, label: 'QB' },
    { position: 'FB', x: 300, y: 245, label: 'FB' },
    { position: 'TB', x: 300, y: 280, label: 'TB' },
    { position: 'WB', x: 410, y: 210, label: 'WB' }
  ]
};

// ============================================
// ACCURATE DEFENSIVE FORMATIONS
// ALL DEFENSIVE PLAYERS: y < 200 (beyond LOS)
// ============================================

export const DEFENSIVE_FORMATIONS: FormationConfig = {
  '4-3 Base': [
    // Defensive Line (close to LOS but beyond it)
    { position: 'DE', x: 180, y: 185, label: 'DE' },
    { position: 'DT', x: 270, y: 185, label: 'DT' },
    { position: 'DT', x: 330, y: 185, label: 'DT' },
    { position: 'DE', x: 420, y: 185, label: 'DE' },
    // Linebackers (5 yards off LOS)
    { position: 'SAM', x: 140, y: 160, label: 'SAM' },
    { position: 'MIKE', x: 300, y: 160, label: 'MIKE' },
    { position: 'WILL', x: 460, y: 160, label: 'WILL' },
    // Secondary (8-12 yards off)
    { position: 'CB', x: 70, y: 135, label: 'CB' },
    { position: 'CB', x: 530, y: 135, label: 'CB' },
    { position: 'FS', x: 300, y: 95, label: 'FS' },
    { position: 'SS', x: 400, y: 125, label: 'SS' }
  ],
  
  '3-4 Base': [
    // Defensive Line
    { position: 'DE', x: 240, y: 185, label: 'DE' },
    { position: 'NT', x: 300, y: 185, label: 'NT' },
    { position: 'DE', x: 360, y: 185, label: 'DE' },
    // Linebackers
    { position: 'OLB', x: 100, y: 160, label: 'OLB' },
    { position: 'ILB', x: 260, y: 160, label: 'ILB' },
    { position: 'ILB', x: 340, y: 160, label: 'ILB' },
    { position: 'OLB', x: 500, y: 160, label: 'OLB' },
    // Secondary
    { position: 'CB', x: 70, y: 135, label: 'CB' },
    { position: 'CB', x: 530, y: 135, label: 'CB' },
    { position: 'FS', x: 300, y: 95, label: 'FS' },
    { position: 'SS', x: 200, y: 125, label: 'SS' }
  ],
  
  'Nickel (4-2-5)': [
    // Defensive Line
    { position: 'DE', x: 180, y: 185, label: 'DE' },
    { position: 'DT', x: 270, y: 185, label: 'DT' },
    { position: 'DT', x: 330, y: 185, label: 'DT' },
    { position: 'DE', x: 420, y: 185, label: 'DE' },
    // Linebackers (only 2)
    { position: 'MLB', x: 270, y: 160, label: 'MLB' },
    { position: 'MLB', x: 330, y: 160, label: 'MLB' },
    // Secondary (5 DBs)
    { position: 'CB', x: 70, y: 145, label: 'CB' },
    { position: 'CB', x: 530, y: 145, label: 'CB' },
    { position: 'NB', x: 180, y: 155, label: 'NB' },
    { position: 'FS', x: 300, y: 95, label: 'FS' },
    { position: 'SS', x: 400, y: 125, label: 'SS' }
  ]
};

// ============================================
// SPECIAL TEAMS FORMATIONS (ALL 5)
// Kicking team: y >= 200, Receiving team: y < 200
// ============================================

export const SPECIAL_TEAMS_FORMATIONS: FormationConfig = {
  'Kickoff': [
    { position: 'K', x: 300, y: 300, label: 'K' },
    // Coverage team (all at or behind LOS)
    { position: 'L5', x: 80, y: 250, label: 'L5' },
    { position: 'L4', x: 160, y: 250, label: 'L4' },
    { position: 'L3', x: 240, y: 250, label: 'L3' },
    { position: 'L2', x: 280, y: 250, label: 'L2' },
    { position: 'L1', x: 320, y: 250, label: 'L1' },
    { position: 'R1', x: 360, y: 250, label: 'R1' },
    { position: 'R2', x: 420, y: 250, label: 'R2' },
    { position: 'R3', x: 480, y: 250, label: 'R3' },
    { position: 'R4', x: 540, y: 250, label: 'R4' },
    { position: 'R5', x: 620, y: 250, label: 'R5' }
  ],
  
  'Kick Return': [
    // Return team (all beyond opponent's LOS)
    { position: 'L5', x: 80, y: 155, label: 'L5' },
    { position: 'L4', x: 160, y: 155, label: 'L4' },
    { position: 'L3', x: 240, y: 155, label: 'L3' },
    { position: 'L2', x: 280, y: 155, label: 'L2' },
    { position: 'L1', x: 320, y: 155, label: 'L1' },
    { position: 'R1', x: 360, y: 155, label: 'R1' },
    { position: 'R2', x: 420, y: 155, label: 'R2' },
    { position: 'R3', x: 480, y: 155, label: 'R3' },
    { position: 'R4', x: 540, y: 155, label: 'R4' },
    // Deep returners
    { position: 'KR1', x: 250, y: 75, label: 'KR1' },
    { position: 'KR2', x: 350, y: 75, label: 'KR2' }
  ],
  
  'Punt': [
    // Punt team (all at or behind LOS)
    { position: 'LS', x: 300, y: 200, label: 'LS' },
    { position: 'LG', x: 260, y: 200, label: 'LG' },
    { position: 'RG', x: 340, y: 200, label: 'RG' },
    { position: 'LT', x: 220, y: 200, label: 'LT' },
    { position: 'RT', x: 380, y: 200, label: 'RT' },
    // Gunners on LOS
    { position: 'LW', x: 100, y: 200, label: 'LW' },
    { position: 'RW', x: 500, y: 200, label: 'RW' },
    // Up backs (behind LOS)
    { position: 'LU', x: 230, y: 230, label: 'LU' },
    { position: 'RU', x: 370, y: 230, label: 'RU' },
    // Personal protector
    { position: 'PP', x: 300, y: 250, label: 'PP' },
    // Punter (15 yards back)
    { position: 'P', x: 300, y: 320, label: 'P' }
  ],
  
  'Punt Return': [
    // Return team (all beyond opponent's LOS)
    { position: 'RL', x: 100, y: 175, label: 'RL' },
    { position: 'LL', x: 220, y: 175, label: 'LL' },
    { position: 'LC', x: 280, y: 175, label: 'LC' },
    { position: 'RC', x: 320, y: 175, label: 'RC' },
    { position: 'RR', x: 380, y: 175, label: 'RR' },
    { position: 'RR2', x: 500, y: 175, label: 'RR2' },
    // Rushers
    { position: 'VL', x: 250, y: 190, label: 'VL' },
    { position: 'VR', x: 350, y: 190, label: 'VR' },
    // Jammers (on gunners) - FIXED: was y=200, now y=195
    { position: 'JL', x: 100, y: 195, label: 'JL' },
    { position: 'JR', x: 500, y: 195, label: 'JR' },
    // Punt returner
    { position: 'PR', x: 300, y: 95, label: 'PR' }
  ],
  
  'Field Goal': [
    // FG team (all at or behind LOS)
    { position: 'LS', x: 300, y: 200, label: 'LS' },
    { position: 'LG', x: 270, y: 200, label: 'LG' },
    { position: 'RG', x: 330, y: 200, label: 'RG' },
    { position: 'LT', x: 240, y: 200, label: 'LT' },
    { position: 'RT', x: 360, y: 200, label: 'RT' },
    { position: 'LE', x: 210, y: 200, label: 'LE' },
    { position: 'RE', x: 390, y: 200, label: 'RE' },
    // Wings
    { position: 'LW', x: 180, y: 200, label: 'LW' },
    { position: 'RW', x: 420, y: 200, label: 'RW' },
    // Holder (7 yards back)
    { position: 'H', x: 300, y: 255, label: 'H' },
    // Kicker (behind holder)
    { position: 'K', x: 290, y: 265, label: 'K' }
  ]
};

// ============================================
// ATTRIBUTE SCHEMA FOR DATABASE
// ============================================

/**
 * TypeScript type for play attributes stored in database
 */
export interface PlayAttributes {
  odk: 'offense' | 'defense' | 'specialTeams';
  formation: string;
  downDistance?: string;
  fieldZone?: string;
  hash?: string;
  gameContext?: string[];
  customTags?: string[];
  
  playType?: string;
  personnel?: string;
  runConcept?: string;
  passConcept?: string;
  protection?: string;
  motion?: string;
  targetHole?: string;
  ballCarrier?: string;
  
  front?: string;
  coverage?: string;
  blitzType?: string;
  stunt?: string;
  pressLevel?: string;
  
  unit?: string;
  kickoffType?: string;
  puntType?: string;
  returnScheme?: string;
  
  result?: {
    outcome?: string;
    yardsGained?: number;
    isSuccess?: boolean;
    notes?: string;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

export function getAssignmentOptions(position: string, playType: 'run' | 'pass'): string[] {
  const positionUpper = position.toUpperCase();
  
  if (POSITION_GROUPS.linemen.includes(position)) {
    return [...BLOCKING_ASSIGNMENTS];
  }
  
  if (POSITION_GROUPS.backs.includes(position)) {
    return [...RB_ASSIGNMENTS];
  }
  
  if (POSITION_GROUPS.receivers.includes(position) || 
      positionUpper.includes('WR') || 
      positionUpper.includes('TE') ||
      ['X', 'Y', 'Z', 'SL', 'SR', 'SE', 'FL'].includes(positionUpper)) {
    if (playType === 'run') {
      return [...RUNNING_HOLES, 'Block'];
    } else {
      return [...PASSING_ROUTES];
    }
  }
  
  return [...PASSING_ROUTES];
}

export function validatePlayAttributes(attributes: Partial<PlayAttributes>): boolean {
  if (!attributes.odk || !attributes.formation) {
    return false;
  }
  return true;
}

export const FOOTBALL_CONFIG = {
  common: COMMON_ATTRIBUTES,
  offensive: OFFENSIVE_ATTRIBUTES,
  defensive: DEFENSIVE_ATTRIBUTES,
  specialTeams: SPECIAL_TEAMS_ATTRIBUTES,
  results: PLAY_RESULTS,
  routes: {
    blockingAssignments: BLOCKING_ASSIGNMENTS,
    runningHoles: RUNNING_HOLES,
    passingRoutes: PASSING_ROUTES,
    rbAssignments: RB_ASSIGNMENTS
  },
  formations: {
    offensive: OFFENSIVE_FORMATIONS,
    defensive: DEFENSIVE_FORMATIONS,
    specialTeams: SPECIAL_TEAMS_FORMATIONS
  },
  positionGroups: POSITION_GROUPS,
  helpers: {
    getAttributeOptions,
    getAssignmentOptions,
    validatePlayAttributes
  }
} as const;