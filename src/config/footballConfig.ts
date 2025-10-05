// src/config/footballConfig.ts
// Centralized configuration for all football-related options and formations

import { Player } from '@/types/football';

// Type definitions for formations
export interface FormationConfig {
  [key: string]: Player[];
}

// ============================================
// OFFENSIVE CONFIGURATIONS
// ============================================

export const OFFENSIVE_FORMATIONS: FormationConfig = {
  // Shotgun Formations
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
  'Gun Trips Right': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'QB', x: 300, y: 380, label: 'QB' },
    { position: 'RB', x: 345, y: 380, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 420, y: 290, label: 'Y' },
    { position: 'WR3', x: 480, y: 275, label: 'Z' },
    { position: 'TE', x: 480, y: 260, label: 'TE' }
  ],
  'Gun Empty': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'QB', x: 300, y: 380, label: 'QB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' },
    { position: 'WR3', x: 120, y: 280, label: 'SL' },
    { position: 'WR4', x: 480, y: 280, label: 'SR' },
    { position: 'WR5', x: 300, y: 340, label: 'RB' }
  ],
  'Gun Bunch Right': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'QB', x: 300, y: 380, label: 'QB' },
    { position: 'RB', x: 250, y: 380, label: 'RB' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 460, y: 275, label: 'Z' },
    { position: 'WR3', x: 500, y: 280, label: 'SL' }
  ],
  
  // Pistol Formations
  'Pistol': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 330, label: 'QB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' },
    { position: 'SL', x: 120, y: 280, label: 'SL' }
  ],
  
  // I-Formation Family
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
  'Strong I': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE1', x: 480, y: 260, label: 'TE' },
    { position: 'TE2', x: 120, y: 260, label: 'TE2' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' },
    { position: 'WR', x: 540, y: 260, label: 'Z' }
  ],
  'Power I': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE1', x: 480, y: 260, label: 'TE' },
    { position: 'TE2', x: 510, y: 260, label: 'TE2' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' },
    { position: 'WR', x: 60, y: 260, label: 'X' }
  ],
  
  // Wing-T Family
  'Wing-T': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'WB1', x: 450, y: 290, label: 'WB1' },
    { position: 'WB2', x: 150, y: 290, label: 'WB2' },
    { position: 'SE', x: 60, y: 260, label: 'SE' }
  ],
  'Double Wing': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE1', x: 120, y: 260, label: 'TE' },
    { position: 'TE2', x: 480, y: 260, label: 'TE2' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'WB1', x: 450, y: 290, label: 'WB1' },
    { position: 'WB2', x: 150, y: 290, label: 'WB2' }
  ],
  
  // Singleback Formations
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
  ],
  'Pro Style': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 340, y: 330, label: 'FB' },
    { position: 'RB', x: 300, y: 360, label: 'RB' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' }
  ],
  
  // Split Back Formations
  'Split Backs': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'RB1', x: 250, y: 350, label: 'RB' },
    { position: 'RB2', x: 350, y: 350, label: 'RB2' },
    { position: 'WR1', x: 60, y: 260, label: 'X' },
    { position: 'WR2', x: 540, y: 260, label: 'Z' }
  ],
  
  // Heavy/Jumbo Formations
  'Jumbo': [
    { position: 'LT', x: 160, y: 260, label: 'LT' },
    { position: 'LG', x: 220, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 380, y: 260, label: 'RG' },
    { position: 'RT', x: 440, y: 260, label: 'RT' },
    { position: 'TE1', x: 120, y: 260, label: 'TE' },
    { position: 'TE2', x: 480, y: 260, label: 'TE2' },
    { position: 'TE3', x: 520, y: 260, label: 'TE3' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' }
  ],
  'Goal Line': [
    { position: 'LT', x: 200, y: 260, label: 'LT' },
    { position: 'LG', x: 250, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 350, y: 260, label: 'RG' },
    { position: 'RT', x: 400, y: 260, label: 'RT' },
    { position: 'TE1', x: 150, y: 260, label: 'TE' },
    { position: 'TE2', x: 450, y: 260, label: 'TE2' },
    { position: 'TE3', x: 100, y: 260, label: 'TE3' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'RB', x: 300, y: 380, label: 'RB' }
  ],
  
  // Special Formations
  'Wildcat': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE', x: 480, y: 260, label: 'TE' },
    { position: 'RB1', x: 300, y: 380, label: 'RB' },
    { position: 'RB2', x: 250, y: 330, label: 'RB2' },
    { position: 'QB', x: 60, y: 280, label: 'QB' },
    { position: 'WR1', x: 540, y: 260, label: 'Z' },
    { position: 'WR2', x: 120, y: 260, label: 'X' }
  ],
  'Wishbone': [
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'C', x: 300, y: 260, label: 'C' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'TE1', x: 120, y: 260, label: 'TE' },
    { position: 'TE2', x: 480, y: 260, label: 'TE2' },
    { position: 'QB', x: 300, y: 290, label: 'QB' },
    { position: 'FB', x: 300, y: 335, label: 'FB' },
    { position: 'HB1', x: 250, y: 380, label: 'HB1' },
    { position: 'HB2', x: 350, y: 380, label: 'HB2' }
  ]
};

// ============================================
// DEFENSIVE CONFIGURATIONS
// ============================================

export const DEFENSIVE_FORMATIONS: FormationConfig = {
  // 4-3 Defense Family
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
  '4-3 Over': [
    { position: 'DE1', x: 150, y: 275, label: 'DE1' },
    { position: 'DT1', x: 270, y: 275, label: 'DT1' },
    { position: 'DT2', x: 330, y: 275, label: 'DT2' },
    { position: 'DE2', x: 450, y: 275, label: 'DE2' },
    { position: 'SAM', x: 500, y: 310, label: 'SAM' },
    { position: 'MIKE', x: 300, y: 320, label: 'MIKE' },
    { position: 'WILL', x: 180, y: 320, label: 'WILL' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ],
  '4-3 Under': [
    { position: 'DE1', x: 180, y: 275, label: 'DE1' },
    { position: 'DT1', x: 270, y: 275, label: 'DT1' },
    { position: 'DT2', x: 330, y: 275, label: 'DT2' },
    { position: 'DE2', x: 420, y: 275, label: 'DE2' },
    { position: 'SAM', x: 100, y: 310, label: 'SAM' },
    { position: 'MIKE', x: 240, y: 320, label: 'MIKE' },
    { position: 'WILL', x: 360, y: 320, label: 'WILL' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 300, y: 410, label: 'FS' },
    { position: 'SS', x: 180, y: 380, label: 'SS' }
  ],
  
  // 3-4 Defense Family
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
  ],
  '3-3-5': [
    { position: 'DE1', x: 180, y: 275, label: 'DE1' },
    { position: 'NT', x: 300, y: 275, label: 'NT' },
    { position: 'DE2', x: 420, y: 275, label: 'DE2' },
    { position: 'LB1', x: 180, y: 320, label: 'LB1' },
    { position: 'MLB', x: 300, y: 320, label: 'MLB' },
    { position: 'LB2', x: 420, y: 320, label: 'LB2' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'NB', x: 120, y: 350, label: 'NB' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ],
  
  // Nickel Packages
  '4-2-5 Nickel': [
    { position: 'DE1', x: 120, y: 275, label: 'DE1' },
    { position: 'DT1', x: 240, y: 275, label: 'DT1' },
    { position: 'DT2', x: 360, y: 275, label: 'DT2' },
    { position: 'DE2', x: 480, y: 275, label: 'DE2' },
    { position: 'MIKE', x: 240, y: 320, label: 'MIKE' },
    { position: 'WILL', x: 360, y: 320, label: 'WILL' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'NB', x: 120, y: 320, label: 'NB' },
    { position: 'FS', x: 300, y: 410, label: 'FS' },
    { position: 'SS', x: 480, y: 380, label: 'SS' }
  ],
  '2-4-5 Nickel': [
    { position: 'DE1', x: 240, y: 275, label: 'DE1' },
    { position: 'DE2', x: 360, y: 275, label: 'DE2' },
    { position: 'OLB1', x: 120, y: 310, label: 'OLB1' },
    { position: 'ILB1', x: 240, y: 320, label: 'ILB1' },
    { position: 'ILB2', x: 360, y: 320, label: 'ILB2' },
    { position: 'OLB2', x: 480, y: 310, label: 'OLB2' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'NB', x: 300, y: 350, label: 'NB' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ],
  
  // Dime Package
  '3-2-6 Dime': [
    { position: 'DE1', x: 180, y: 275, label: 'DE1' },
    { position: 'NT', x: 300, y: 275, label: 'NT' },
    { position: 'DE2', x: 420, y: 275, label: 'DE2' },
    { position: 'LB1', x: 240, y: 320, label: 'LB1' },
    { position: 'LB2', x: 360, y: 320, label: 'LB2' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'NB', x: 120, y: 350, label: 'NB' },
    { position: 'DB', x: 480, y: 350, label: 'DB' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ],
  
  // Quarter Package
  '3-1-7 Quarter': [
    { position: 'DE1', x: 180, y: 275, label: 'DE1' },
    { position: 'NT', x: 300, y: 275, label: 'NT' },
    { position: 'DE2', x: 420, y: 275, label: 'DE2' },
    { position: 'MLB', x: 300, y: 320, label: 'MLB' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'CB3', x: 120, y: 350, label: 'CB3' },
    { position: 'CB4', x: 480, y: 350, label: 'CB4' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' },
    { position: 'DB', x: 300, y: 390, label: 'DB' }
  ],
  
  // Special Defenses
  '46 Defense': [
    { position: 'DE1', x: 180, y: 275, label: 'DE1' },
    { position: 'DT1', x: 270, y: 275, label: 'DT1' },
    { position: 'DT2', x: 330, y: 275, label: 'DT2' },
    { position: 'DE2', x: 420, y: 275, label: 'DE2' },
    { position: 'LB1', x: 150, y: 310, label: 'LB1' },
    { position: 'MLB', x: 300, y: 305, label: 'MLB' },
    { position: 'LB2', x: 450, y: 310, label: 'LB2' },
    { position: 'SS', x: 300, y: 285, label: 'SS' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 300, y: 410, label: 'FS' }
  ],
  '5-2 Defense': [
    { position: 'DE1', x: 120, y: 275, label: 'DE1' },
    { position: 'DT1', x: 210, y: 275, label: 'DT1' },
    { position: 'NT', x: 300, y: 275, label: 'NT' },
    { position: 'DT2', x: 390, y: 275, label: 'DT2' },
    { position: 'DE2', x: 480, y: 275, label: 'DE2' },
    { position: 'LB1', x: 240, y: 320, label: 'LB1' },
    { position: 'LB2', x: 360, y: 320, label: 'LB2' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ],
  '6-1 Defense': [
    { position: 'DE1', x: 100, y: 275, label: 'DE1' },
    { position: 'DT1', x: 200, y: 275, label: 'DT1' },
    { position: 'G1', x: 260, y: 275, label: 'G1' },
    { position: 'G2', x: 340, y: 275, label: 'G2' },
    { position: 'DT2', x: 400, y: 275, label: 'DT2' },
    { position: 'DE2', x: 500, y: 275, label: 'DE2' },
    { position: 'MLB', x: 300, y: 320, label: 'MLB' },
    { position: 'CB1', x: 60, y: 335, label: 'CB1' },
    { position: 'CB2', x: 540, y: 335, label: 'CB2' },
    { position: 'FS', x: 200, y: 410, label: 'FS' },
    { position: 'SS', x: 400, y: 410, label: 'SS' }
  ]
};

// ============================================
// SPECIAL TEAMS CONFIGURATIONS
// ============================================

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
  ],
  'Kick Return': [
    { position: 'L1', x: 60, y: 350, label: 'L1' },
    { position: 'L2', x: 120, y: 350, label: 'L2' },
    { position: 'L3', x: 180, y: 350, label: 'L3' },
    { position: 'L4', x: 240, y: 350, label: 'L4' },
    { position: 'L5', x: 285, y: 350, label: 'L5' },
    { position: 'R5', x: 315, y: 350, label: 'R5' },
    { position: 'R4', x: 360, y: 350, label: 'R4' },
    { position: 'R3', x: 420, y: 350, label: 'R3' },
    { position: 'R2', x: 480, y: 350, label: 'R2' },
    { position: 'R1', x: 540, y: 350, label: 'R1' },
    { position: 'KR', x: 300, y: 80, label: 'KR' }
  ],
  'Punt': [
    { position: 'P', x: 300, y: 50, label: 'P' },
    { position: 'LS', x: 300, y: 260, label: 'LS' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'LW', x: 180, y: 260, label: 'LW' },
    { position: 'RW', x: 420, y: 260, label: 'RW' },
    { position: 'LE', x: 120, y: 230, label: 'LE' },
    { position: 'RE', x: 480, y: 230, label: 'RE' },
    { position: 'L1', x: 60, y: 215, label: 'L1' },
    { position: 'R1', x: 540, y: 215, label: 'R1' },
    { position: 'PP', x: 300, y: 170, label: 'PP' }
  ],
  'Punt Return': [
    { position: 'PR', x: 300, y: 40, label: 'PR' },
    { position: 'L1', x: 60, y: 275, label: 'L1' },
    { position: 'L2', x: 120, y: 275, label: 'L2' },
    { position: 'L3', x: 180, y: 275, label: 'L3' },
    { position: 'L4', x: 240, y: 275, label: 'L4' },
    { position: 'L5', x: 270, y: 275, label: 'L5' },
    { position: 'R5', x: 330, y: 275, label: 'R5' },
    { position: 'R4', x: 360, y: 275, label: 'R4' },
    { position: 'R3', x: 420, y: 275, label: 'R3' },
    { position: 'R2', x: 480, y: 275, label: 'R2' },
    { position: 'R1', x: 540, y: 275, label: 'R1' }
  ],
  'Field Goal': [
    { position: 'K', x: 300, y: 140, label: 'K' },
    { position: 'H', x: 285, y: 170, label: 'H' },
    { position: 'LS', x: 300, y: 260, label: 'LS' },
    { position: 'LG', x: 240, y: 260, label: 'LG' },
    { position: 'RG', x: 360, y: 260, label: 'RG' },
    { position: 'LT', x: 180, y: 260, label: 'LT' },
    { position: 'RT', x: 420, y: 260, label: 'RT' },
    { position: 'LE', x: 120, y: 260, label: 'LE' },
    { position: 'RE', x: 480, y: 260, label: 'RE' },
    { position: 'LW', x: 60, y: 245, label: 'LW' },
    { position: 'RW', x: 540, y: 245, label: 'RW' }
  ]
};

// ============================================
// PLAY OPTIONS AND CONFIGURATIONS
// ============================================

export const OFFENSIVE_OPTIONS = {
  concepts: [
    'RPO (Run-Pass Option)',
    'Quick Game',
    'Drop Back Pass',
    'Play Action',
    'Screen',
    'Draw',
    'Inside Zone',
    'Outside Zone',
    'Power',
    'Counter',
    'Trap',
    'Sweep',
    'Bootleg',
    'Rollout',
    'Sprint Out',
    'Hard Count',
    'Check with Me',
    'Kill/Alert',
    'Option'
  ],
  personnel: [
    '11 (1RB, 1TE)',
    '12 (1RB, 2TE)',
    '21 (2RB, 1TE)',
    '10 (1RB, 0TE)',
    '20 (2RB, 0TE)',
    '13 (1RB, 3TE)',
    '22 (2RB, 2TE)',
    '00 (0RB, 0TE)',
    '01 (0RB, 1TE)'
  ],
  backfield: [
    'Gun',
    'Pistol',
    'Under Center',
    'I-Formation',
    'Split Back',
    'Wing-T',
    'Single Back',
    'Empty'
  ],
  motions: [
    'None',
    'Fly Motion',
    'Orbit Motion',
    'Jet Motion',
    'Return Motion',
    'Shift',
    'Trade',
    'Yo-Yo',
    'Exit',
    'Divide'
  ],
  protections: [
    '5-Man',
    '6-Man',
    '7-Man',
    'Slide',
    'Turnback',
    'Combo',
    'Big on Big',
    'Vertical Set',
    'Half Slide',
    'Jet Protection'
  ]
};

export const DEFENSIVE_OPTIONS = {
  fronts: [
    '4-3 Over',
    '4-3 Under',
    '3-4 Base',
    '3-3 Stack',
    '5-2',
    '6-1',
    '4-2-5 Nickel',
    '3-3-5 Nickel',
    '2-4-5 Dime',
    '1-5-5 Psycho',
    'Bear Front'
  ],
  coverages: [
    'Cover 0',
    'Cover 1',
    'Cover 2',
    'Cover 3',
    'Cover 4',
    'Cover 6',
    'Cover 7',
    '2-Man Under',
    'Tampa 2',
    'Quarters',
    'Palms',
    'Bracket'
  ],
  blitzes: [
    'None',
    'Mike',
    'Will',
    'Sam',
    'Double A-Gap',
    'Fire Zone',
    'Corner',
    'Safety',
    'Overload',
    'Cross Dog',
    'Green Dog'
  ],
  stunts: [
    'None',
    'T-T (Twist)',
    'E-T (Games)',
    'Pirate',
    'Cross',
    'Loop',
    'Spike',
    'Slant',
    'Pinch',
    'Rip/Liz'
  ]
};

export const SPECIAL_TEAMS_OPTIONS = {
  kickoffTypes: [
    'Deep Middle',
    'Deep Left',
    'Deep Right',
    'Squib',
    'Pooch',
    'Onside',
    'Sky Kick'
  ],
  kickoffCoverage: [
    'Standard',
    'Overload Right',
    'Overload Left',
    'Wedge Buster',
    'Contain Rush'
  ],
  puntTypes: [
    'Standard',
    'Coffin Corner',
    'Directional',
    'Pooch',
    'Rugby',
    'Sky Punt'
  ],
  puntCoverage: [
    'Standard',
    'Spread',
    'Shield',
    'Max Protect',
    'Gunners Out'
  ],
  returnTypes: [
    'Middle Return',
    'Left Return',
    'Right Return',
    'Wall Return',
    'Wedge Return'
  ],
  fieldGoalProtection: [
    'Standard',
    'Overload Right',
    'Overload Left',
    'Safe'
  ],
  fakeOptions: [
    'None',
    'Pass',
    'Run',
    'Direct Snap'
  ]
};

// ============================================
// FIELD CONFIGURATION
// ============================================

export const FIELD_CONFIG = {
  width: 600,
  height: 450,
  // Line of scrimmage position
  lineOfScrimmage: 260,
  // Colors
  colors: {
    field: '#2a6e3f',
    lines: '#ffffff',
    offense: '#1e40af',
    defense: '#dc2626',
    specialTeams: '#7c3aed',
    route: '#fbbf24',
    selectedPlayer: '#10b981'
  },
  // Zones for visual reference
  zones: {
    deepZone: { y: 0, height: 150 },
    intermediateZone: { y: 150, height: 110 },
    shortZone: { y: 260, height: 100 },
    backfield: { y: 360, height: 90 }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get all formations for a specific unit
export function getFormations(unit: 'offense' | 'defense' | 'special') {
  switch(unit) {
    case 'offense':
      return Object.keys(OFFENSIVE_FORMATIONS);
    case 'defense':
      return Object.keys(DEFENSIVE_FORMATIONS);
    case 'special':
      return Object.keys(SPECIAL_TEAMS_FORMATIONS);
    default:
      return [];
  }
}

// Get formation data by name
export function getFormationData(formationName: string): Player[] | null {
  return OFFENSIVE_FORMATIONS[formationName] || 
         DEFENSIVE_FORMATIONS[formationName] || 
         SPECIAL_TEAMS_FORMATIONS[formationName] || 
         null;
}

// Add custom formation (for user-created formations)
const customFormations: FormationConfig = {};

export function addCustomFormation(
  unit: 'offense' | 'defense' | 'special',
  name: string, 
  players: Player[]
) {
  const key = `${unit}_${name}`;
  customFormations[key] = players;
  
  // Also add to the appropriate constant for immediate use
  switch(unit) {
    case 'offense':
      OFFENSIVE_FORMATIONS[name] = players;
      break;
    case 'defense':
      DEFENSIVE_FORMATIONS[name] = players;
      break;
    case 'special':
      SPECIAL_TEAMS_FORMATIONS[name] = players;
      break;
  }
  
  return key;
}

// Get all custom formations
export function getCustomFormations() {
  return customFormations;
}

// Export everything as a single config object for convenience
export const FOOTBALL_CONFIG = {
  formations: {
    offensive: OFFENSIVE_FORMATIONS,
    defensive: DEFENSIVE_FORMATIONS,
    specialTeams: SPECIAL_TEAMS_FORMATIONS,
    custom: customFormations
  },
  options: {
    offensive: OFFENSIVE_OPTIONS,
    defensive: DEFENSIVE_OPTIONS,
    specialTeams: SPECIAL_TEAMS_OPTIONS
  },
  field: FIELD_CONFIG,
  utils: {
    getFormations,
    getFormationData,
    addCustomFormation,
    getCustomFormations
  }
};