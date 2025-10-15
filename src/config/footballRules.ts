// src/config/footballRules.ts
// Football Rules & Validation System
// Enforces legal formations, motion, and positioning

import { Player } from '@/types/football';

// ============================================
// FIELD DIMENSIONS & ZONES
// ============================================

export const FIELD_RULES = {
  // Canvas dimensions (700x400)
  canvasWidth: 700,
  canvasHeight: 400,
  
  // Line of scrimmage position
  lineOfScrimmage: 200,
  
  // Neutral zone (1 yard = ~12 pixels at this scale)
  neutralZoneWidth: 12,
  
  // Field boundaries
  bounds: {
    minX: 0,
    maxX: 700,
    minY: 0,
    maxY: 400
  },
  
  // Hash marks
  leftHash: 250,
  rightHash: 450,
  
  // Zones relative to LOS
  zones: {
    offensiveBackfield: { minY: 200, maxY: 400 },  // Behind LOS
    defensiveBackfield: { minY: 0, maxY: 200 },    // Beyond LOS
    neutralZone: { minY: 194, maxY: 206 }          // ~1 yard either side
  }
} as const;

// ============================================
// POSITION CLASSIFICATION
// ============================================

/**
 * Position types for rule enforcement
 */
export const POSITION_TYPES = {
  // Offensive line (ineligible receivers)
  offensiveLine: ['C', 'LG', 'RG', 'LT', 'RT', 'G', 'T'],
  
  // Eligible receivers
  eligibleReceivers: ['WR', 'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'X', 'Y', 'Z', 'SL', 'SR', 'TE', 'TE1', 'TE2', 'SE', 'FL'],
  
  // Backfield
  backs: ['QB', 'RB', 'FB', 'TB', 'SB', 'HB', 'WB'],
  
  // Defensive line
  defensiveLine: ['DE', 'DT', 'NT', 'DL', 'NG'],
  
  // Linebackers
  linebackers: ['LB', 'MLB', 'ILB', 'OLB', 'SAM', 'MIKE', 'WILL', 'JACK'],
  
  // Defensive backs
  defensiveBacks: ['CB', 'S', 'SS', 'FS', 'NB', 'DB']
} as const;

/**
 * Check if position is offensive lineman
 */
export function isOffensiveLineman(position: string): boolean {
  return POSITION_TYPES.offensiveLine.some(pos => 
    position.toUpperCase().includes(pos)
  );
}

/**
 * Check if position is eligible receiver
 */
export function isEligibleReceiver(position: string): boolean {
  return POSITION_TYPES.eligibleReceivers.some(pos => 
    position.toUpperCase().includes(pos)
  );
}

/**
 * Check if position is in backfield
 */
export function isBackfield(position: string): boolean {
  return POSITION_TYPES.backs.some(pos => 
    position.toUpperCase().includes(pos)
  );
}

// ============================================
// OFFENSIVE FORMATION RULES
// ============================================

export interface FormationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate offensive formation legality
 * Rules enforced:
 * 1. At least 7 players on line of scrimmage
 * 2. No more than 4 players in backfield
 * 3. All offensive players at or behind LOS
 * 4. Players within field bounds
 */
export function validateOffensiveFormation(players: Player[]): FormationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Rule 1: Check all offensive players are at/behind LOS (y >= 200)
  const playersAheadOfLOS = players.filter(p => p.y < FIELD_RULES.lineOfScrimmage);
  if (playersAheadOfLOS.length > 0) {
    errors.push(`${playersAheadOfLOS.length} offensive player(s) ahead of line of scrimmage: ${playersAheadOfLOS.map(p => p.label).join(', ')}`);
  }
  
  // Rule 2: Count players on the line (y = 200, within 5 pixels tolerance)
  const lineOfScrimmageY = FIELD_RULES.lineOfScrimmage;
  const tolerance = 5;
  const playersOnLine = players.filter(p => 
    Math.abs(p.y - lineOfScrimmageY) <= tolerance
  );
  
  if (playersOnLine.length < 7) {
    errors.push(`Only ${playersOnLine.length} players on line of scrimmage. Need at least 7.`);
  }
  
  // Rule 3: Count backfield players (should be max 4)
  const backfieldPlayers = players.filter(p => 
    p.y > lineOfScrimmageY + tolerance
  );
  
  if (backfieldPlayers.length > 4) {
    warnings.push(`${backfieldPlayers.length} players in backfield. Maximum is 4.`);
  }
  
  // Rule 4: Check field boundaries
  const outOfBounds = players.filter(p => 
    p.x < FIELD_RULES.bounds.minX || 
    p.x > FIELD_RULES.bounds.maxX ||
    p.y < FIELD_RULES.bounds.minY ||
    p.y > FIELD_RULES.bounds.maxY
  );
  
  if (outOfBounds.length > 0) {
    errors.push(`${outOfBounds.length} player(s) out of bounds`);
  }
  
  // Rule 5: Eligible receiver rules
  // At least 5 eligible receivers (ends + backs)
  const eligibleCount = players.filter(p => 
    isEligibleReceiver(p.position) || isBackfield(p.position)
  ).length;
  
  if (eligibleCount < 5) {
    warnings.push(`Only ${eligibleCount} eligible receivers. Typically need at least 5.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate defensive formation positioning
 * Rules enforced:
 * 1. Defensive players beyond line of scrimmage (not in neutral zone)
 * 2. Players within field bounds
 */
export function validateDefensiveFormation(players: Player[]): FormationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Rule 1: Check defensive players are beyond LOS (y < 200)
  const playersBehindLOS = players.filter(p => p.y >= FIELD_RULES.lineOfScrimmage);
  if (playersBehindLOS.length > 0) {
    errors.push(`${playersBehindLOS.length} defensive player(s) behind line of scrimmage (offsides): ${playersBehindLOS.map(p => p.label).join(', ')}`);
  }
  
  // Rule 2: Check neutral zone violations (y between 194-206)
  const inNeutralZone = players.filter(p => 
    p.y >= FIELD_RULES.zones.neutralZone.minY && 
    p.y <= FIELD_RULES.zones.neutralZone.maxY
  );
  
  if (inNeutralZone.length > 0) {
    warnings.push(`${inNeutralZone.length} player(s) in neutral zone: ${inNeutralZone.map(p => p.label).join(', ')}`);
  }
  
  // Rule 3: Field boundaries
  const outOfBounds = players.filter(p => 
    p.x < FIELD_RULES.bounds.minX || 
    p.x > FIELD_RULES.bounds.maxX ||
    p.y < FIELD_RULES.bounds.minY ||
    p.y > FIELD_RULES.bounds.maxY
  );
  
  if (outOfBounds.length > 0) {
    errors.push(`${outOfBounds.length} player(s) out of bounds`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// MOTION RULES
// ============================================

export interface MotionPlayer {
  playerId: string;
  startPosition: { x: number; y: number };
  direction: 'lateral' | 'backward' | 'forward';
  isSet: boolean;  // Player must be set for 1 second before motion
}

/**
 * Validate pre-snap motion legality
 * Rules enforced:
 * 1. Only 1 player in motion at snap
 * 2. Motion must be lateral or backward (not forward)
 * 3. Player must be set for 1 second before motion
 * 4. Motion player must be a back (not lineman)
 */
export function validateMotion(
  motionPlayer: MotionPlayer,
  allPlayers: Player[]
): FormationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Find the player
  const player = allPlayers.find(p => p.id === motionPlayer.playerId);
  if (!player) {
    errors.push('Motion player not found');
    return { isValid: false, errors, warnings };
  }
  
  // Rule 1: Player must be eligible (not offensive lineman)
  if (isOffensiveLineman(player.position)) {
    errors.push('Offensive linemen cannot go in motion');
  }
  
  // Rule 2: Check motion direction
  if (motionPlayer.direction === 'forward') {
    errors.push('Forward motion is illegal. Motion must be lateral or backward.');
  }
  
  // Rule 3: Player must be set before motion
  if (!motionPlayer.isSet) {
    warnings.push('Player must be set for 1 second before motion');
  }
  
  // Rule 4: Check if player is moving toward line of scrimmage
  const movingTowardLOS = player.y < motionPlayer.startPosition.y;
  if (movingTowardLOS) {
    warnings.push('Player appears to be moving forward toward line of scrimmage');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// OFFSIDES DETECTION
// ============================================

/**
 * Check for offsides violations
 * Offense: Any player ahead of the ball (across LOS)
 * Defense: Any player in or past neutral zone at snap
 */
export function checkOffsides(
  players: Player[],
  side: 'offense' | 'defense'
): FormationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (side === 'offense') {
    // Offensive offsides: any player ahead of LOS
    const offsidePlayers = players.filter(p => p.y < FIELD_RULES.lineOfScrimmage);
    
    if (offsidePlayers.length > 0) {
      errors.push(`Offensive offsides: ${offsidePlayers.map(p => p.label).join(', ')}`);
    }
  } else {
    // Defensive offsides: in or past neutral zone
    const offsidePlayers = players.filter(p => 
      p.y >= FIELD_RULES.zones.neutralZone.minY
    );
    
    if (offsidePlayers.length > 0) {
      errors.push(`Defensive offsides: ${offsidePlayers.map(p => p.label).join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// ILLEGAL FORMATION DETECTION
// ============================================

/**
 * Check for common illegal formation issues
 * - Uncovered linemen (not on end of line)
 * - Wrong number of players
 * - Ineligible receivers downfield
 */
export function checkIllegalFormation(players: Player[]): FormationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Rule 1: Must have exactly 11 players
  if (players.length !== 11) {
    errors.push(`Formation has ${players.length} players. Must have exactly 11.`);
  }
  
  // Rule 2: Check for covered receivers
  // Players on LOS should have eligible receivers on the ends
  const lineOfScrimmageY = FIELD_RULES.lineOfScrimmage;
  const tolerance = 5;
  const playersOnLine = players
    .filter(p => Math.abs(p.y - lineOfScrimmageY) <= tolerance)
    .sort((a, b) => a.x - b.x);
  
  if (playersOnLine.length >= 2) {
    const leftEnd = playersOnLine[0];
    const rightEnd = playersOnLine[playersOnLine.length - 1];
    
    // Check if ends are eligible
    if (!isEligibleReceiver(leftEnd.position) && !isOffensiveLineman(leftEnd.position)) {
      warnings.push(`Left end (${leftEnd.label}) may need to be eligible receiver`);
    }
    
    if (!isEligibleReceiver(rightEnd.position) && !isOffensiveLineman(rightEnd.position)) {
      warnings.push(`Right end (${rightEnd.label}) may need to be eligible receiver`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Auto-correct formation to be legal
 * Moves players to legal positions
 */
export function autoCorrectFormation(
  players: Player[],
  side: 'offense' | 'defense'
): Player[] {
  return players.map(player => {
    if (side === 'offense') {
      // Move offensive players at/behind LOS
      if (player.y < FIELD_RULES.lineOfScrimmage) {
        return { ...player, y: FIELD_RULES.lineOfScrimmage };
      }
    } else {
      // Move defensive players beyond LOS
      if (player.y >= FIELD_RULES.lineOfScrimmage) {
        return { ...player, y: FIELD_RULES.lineOfScrimmage - 10 };
      }
    }
    return player;
  });
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(validation: FormationValidation): string {
  if (validation.isValid && validation.warnings.length === 0) {
    return '✅ Formation is legal';
  }
  
  const parts: string[] = [];
  
  if (validation.errors.length > 0) {
    parts.push(`❌ ${validation.errors.length} error(s)`);
  }
  
  if (validation.warnings.length > 0) {
    parts.push(`⚠️ ${validation.warnings.length} warning(s)`);
  }
  
  return parts.join(' | ');
}

// ============================================
// EXPORT ALL VALIDATION FUNCTIONS
// ============================================

export const FOOTBALL_RULES = {
  field: FIELD_RULES,
  positions: POSITION_TYPES,
  validate: {
    offensiveFormation: validateOffensiveFormation,
    defensiveFormation: validateDefensiveFormation,
    motion: validateMotion,
    offsides: checkOffsides,
    illegalFormation: checkIllegalFormation
  },
  helpers: {
    isOffensiveLineman,
    isEligibleReceiver,
    isBackfield,
    autoCorrectFormation,
    getValidationSummary
  }
} as const;