'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { PlayAttributes, PlayDiagram } from '@/types/football';

interface PlayBuilderProps {
  teamId: string;
  teamName: string;
}

interface Player {
  id: string;
  type: 'offense' | 'defense';
  position: string;
  x: number;
  y: number;
  label: string;
}

interface Route {
  id: string;
  playerId: string;
  points: { x: number; y: number }[];
  type: 'pass' | 'run' | 'block' | 'motion';
  routeType?: 'slant' | 'out' | 'go' | 'post' | 'hitch' | 'drag' | 'comeback' | 'corner' | 'seam' | 'flat';
  blockType?: 'zone' | 'man' | 'combo' | 'pull' | 'pass-pro';
  targetId?: string;
}

interface PlayDiagram {
  players: Player[];
  routes: Route[];
  formation: string;
  odk: 'Offense' | 'Defense' | 'Special Teams';
  playType?: string;
  targetHole?: string;
  ballCarrier?: string;
  fieldPosition: { yard: number; hash: 'left' | 'middle' | 'right' };
}

// HUDL-style formation organization
const offensiveFormations = {
  'Gun Spread 11': [
    { position: 'QB', x: 300, y: 360, label: 'QB' },
    { position: 'RB', x: 350, y: 350, label: 'RB' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'WR1', x: 120, y: 320, label: 'X' },
    { position: 'WR2', x: 480, y: 320, label: 'Z' },
    { position: 'WR3', x: 180, y: 340, label: 'SL' },
    { position: 'TE', x: 420, y: 320, label: 'TE' }
  ],
  'Gun Trips Right 11': [
    { position: 'QB', x: 300, y: 360, label: 'QB' },
    { position: 'RB', x: 250, y: 350, label: 'RB' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'WR1', x: 120, y: 320, label: 'X' },
    { position: 'WR2', x: 440, y: 320, label: 'Z' },
    { position: 'WR3', x: 480, y: 340, label: 'SL' },
    { position: 'WR4', x: 520, y: 340, label: 'SL2' },
    { position: 'TE', x: 420, y: 320, label: 'TE' }
  ],
  'I-Formation 21': [
    { position: 'QB', x: 300, y: 350, label: 'QB' },
    { position: 'FB', x: 300, y: 330, label: 'FB' },
    { position: 'RB', x: 300, y: 310, label: 'RB' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'TE', x: 420, y: 320, label: 'TE' },
    { position: 'WR1', x: 120, y: 320, label: 'SE' },
    { position: 'WR2', x: 480, y: 320, label: 'FL' }
  ],
  'Gun Empty 10': [
    { position: 'QB', x: 300, y: 360, label: 'QB' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'WR1', x: 120, y: 320, label: 'X' },
    { position: 'WR2', x: 480, y: 320, label: 'Z' },
    { position: 'WR3', x: 180, y: 340, label: 'SL' },
    { position: 'WR4', x: 420, y: 340, label: 'SR' },
    { position: 'WR5', x: 300, y: 340, label: 'SC' }
  ],
  'Gun 12 Personnel': [
    { position: 'QB', x: 300, y: 360, label: 'QB' },
    { position: 'RB', x: 350, y: 350, label: 'RB' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'TE1', x: 420, y: 320, label: 'TE' },
    { position: 'TE2', x: 180, y: 320, label: 'TE2' },
    { position: 'WR1', x: 120, y: 320, label: 'X' },
    { position: 'WR2', x: 480, y: 320, label: 'Z' }
  ]
};

const defensiveFormations = {
  '4-3 Over': [
    { position: 'DE', x: 180, y: 80, label: 'DE' },
    { position: 'DT', x: 260, y: 80, label: '3T' },
    { position: 'NT', x: 320, y: 80, label: '1T' },
    { position: 'DE', x: 420, y: 80, label: 'DE' },
    { position: 'WILL', x: 200, y: 120, label: 'W' },
    { position: 'MIKE', x: 300, y: 120, label: 'M' },
    { position: 'SAM', x: 400, y: 120, label: 'S' },
    { position: 'CB', x: 100, y: 160, label: 'CB' },
    { position: 'CB', x: 500, y: 160, label: 'CB' },
    { position: 'FS', x: 300, y: 40, label: 'FS' },
    { position: 'SS', x: 380, y: 60, label: 'SS' }
  ],
  '4-2-5 Nickel': [
    { position: 'DE', x: 200, y: 80, label: 'DE' },
    { position: 'DT', x: 270, y: 80, label: 'DT' },
    { position: 'DT', x: 330, y: 80, label: 'DT' },
    { position: 'DE', x: 400, y: 80, label: 'DE' },
    { position: 'WILL', x: 220, y: 120, label: 'W' },
    { position: 'MIKE', x: 300, y: 120, label: 'M' },
    { position: 'CB', x: 100, y: 160, label: 'CB' },
    { position: 'CB', x: 500, y: 160, label: 'CB' },
    { position: 'NCB', x: 200, y: 140, label: 'N' },
    { position: 'FS', x: 300, y: 40, label: 'FS' },
    { position: 'SS', x: 380, y: 60, label: 'SS' }
  ],
  '3-4 Base': [
    { position: 'DE', x: 240, y: 80, label: 'DE' },
    { position: 'NT', x: 300, y: 80, label: 'NT' },
    { position: 'DE', x: 360, y: 80, label: 'DE' },
    { position: 'ROLB', x: 180, y: 120, label: 'R' },
    { position: 'ILB', x: 270, y: 120, label: 'I' },
    { position: 'ILB', x: 330, y: 120, label: 'I' },
    { position: 'LOLB', x: 420, y: 120, label: 'L' },
    { position: 'CB', x: 100, y: 160, label: 'CB' },
    { position: 'CB', x: 500, y: 160, label: 'CB' },
    { position: 'FS', x: 300, y: 40, label: 'FS' },
    { position: 'SS', x: 380, y: 60, label: 'SS' }
  ],
  '3-3-5 Spread': [
    { position: 'DE', x: 240, y: 80, label: 'DE' },
    { position: 'NT', x: 300, y: 80, label: 'NT' },
    { position: 'DE', x: 360, y: 80, label: 'DE' },
    { position: 'OLB', x: 180, y: 120, label: 'O' },
    { position: 'MLB', x: 300, y: 120, label: 'M' },
    { position: 'OLB', x: 420, y: 120, label: 'O' },
    { position: 'CB', x: 100, y: 160, label: 'CB' },
    { position: 'CB', x: 500, y: 160, label: 'CB' },
    { position: 'NCB', x: 200, y: 140, label: 'N' },
    { position: 'FS', x: 300, y: 40, label: 'FS' },
    { position: 'SS', x: 380, y: 60, label: 'SS' }
  ]
};

const specialTeamsFormations = {
  'Kickoff Standard': [
    { position: 'K', x: 300, y: 350, label: 'K' },
    { position: 'L5', x: 180, y: 320, label: 'L5' },
    { position: 'L4', x: 220, y: 320, label: 'L4' },
    { position: 'L3', x: 260, y: 320, label: 'L3' },
    { position: 'L2', x: 280, y: 320, label: 'L2' },
    { position: 'L1', x: 290, y: 320, label: 'L1' },
    { position: 'R1', x: 310, y: 320, label: 'R1' },
    { position: 'R2', x: 320, y: 320, label: 'R2' },
    { position: 'R3', x: 340, y: 320, label: 'R3' },
    { position: 'R4', x: 380, y: 320, label: 'R4' },
    { position: 'R5', x: 420, y: 320, label: 'R5' }
  ],
  'Kickoff Onside': [
    { position: 'K', x: 300, y: 350, label: 'K' },
    { position: 'L3', x: 240, y: 320, label: 'L3' },
    { position: 'L2', x: 270, y: 320, label: 'L2' },
    { position: 'L1', x: 290, y: 320, label: 'L1' },
    { position: 'R1', x: 310, y: 320, label: 'R1' },
    { position: 'R2', x: 330, y: 320, label: 'R2' },
    { position: 'R3', x: 360, y: 320, label: 'R3' },
    { position: 'LL', x: 200, y: 300, label: 'LL' },
    { position: 'LR', x: 240, y: 300, label: 'LR' },
    { position: 'RL', x: 360, y: 300, label: 'RL' },
    { position: 'RR', x: 400, y: 300, label: 'RR' }
  ],
  'Punt Spread': [
    { position: 'P', x: 300, y: 380, label: 'P' },
    { position: 'PS', x: 290, y: 320, label: 'PS' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'PS2', x: 310, y: 320, label: 'PS' },
    { position: 'LE', x: 200, y: 320, label: 'LE' },
    { position: 'RE', x: 400, y: 320, label: 'RE' },
    { position: 'LG', x: 160, y: 300, label: 'LG' },
    { position: 'RG', x: 440, y: 300, label: 'RG' },
    { position: 'UP', x: 300, y: 340, label: 'UP' }
  ],
  'Punt Shield': [
    { position: 'P', x: 300, y: 380, label: 'P' },
    { position: 'PS', x: 290, y: 320, label: 'PS' },
    { position: 'LG', x: 250, y: 320, label: 'LG' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'C', x: 300, y: 320, label: 'C' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'RG', x: 350, y: 320, label: 'RG' },
    { position: 'PS2', x: 310, y: 320, label: 'PS' },
    { position: 'LU', x: 260, y: 340, label: 'LU' },
    { position: 'RU', x: 340, y: 340, label: 'RU' },
    { position: 'FG', x: 300, y: 360, label: 'FG' }
  ],
  'Field Goal Standard': [
    { position: 'K', x: 300, y: 370, label: 'K' },
    { position: 'H', x: 300, y: 350, label: 'H' },
    { position: 'LS', x: 300, y: 320, label: 'LS' },
    { position: 'LG', x: 260, y: 320, label: 'LG' },
    { position: 'LT', x: 220, y: 320, label: 'LT' },
    { position: 'RG', x: 340, y: 320, label: 'RG' },
    { position: 'RT', x: 380, y: 320, label: 'RT' },
    { position: 'LE', x: 180, y: 320, label: 'LE' },
    { position: 'RE', x: 420, y: 320, label: 'RE' },
    { position: 'LW', x: 140, y: 300, label: 'LW' },
    { position: 'RW', x: 460, y: 300, label: 'RW' }
  ]
};

const playTypeOptions = {
  'Offense': [
    { value: 'Run', description: 'Run - Hand off or QB run play' },
    { value: 'Pass', description: 'Pass - Traditional passing play' },
    { value: 'RPO', description: 'RPO - Run-Pass Option, QB reads defense' },
    { value: 'Screen', description: 'Screen - Short pass behind blockers' },
    { value: 'Play Action', description: 'Play Action - Fake handoff then pass' },
    { value: 'Trick/Gadget', description: 'Trick/Gadget - Reverse, flea flicker, etc.' }
  ],
  'Defense': [
    { value: 'Base', description: 'Base - Standard defensive alignment' },
    { value: 'Blitz', description: 'Blitz - Extra pass rushers' },
    { value: 'Coverage', description: 'Coverage - Focus on pass defense' }
  ],
  'Special Teams': [
    { value: 'Coverage', description: 'Coverage - Prevent return for TD' },
    { value: 'Return', description: 'Return - Score or gain field position' },
    { value: 'Block', description: 'Block - Attempt to block kick' },
    { value: 'Fake', description: 'Fake - Trick play instead of kick' }
  ]
};

const offensiveHoles = {
  'withTE': [
    { value: '1', description: 'Hole 1 - Between center and left guard' },
    { value: '2', description: 'Hole 2 - Between center and right guard' },
    { value: '3', description: 'Hole 3 - Between left guard and left tackle' },
    { value: '4', description: 'Hole 4 - Between right guard and right tackle' },
    { value: '5', description: 'Hole 5 - Between left tackle and left end' },
    { value: '6', description: 'Hole 6 - Between right tackle and right end' },
    { value: '7', description: 'Hole 7 - Outside left tight end' },
    { value: '8', description: 'Hole 8 - Outside right tight end' }
  ],
  'noTE': [
    { value: '1', description: 'Hole 1 - Between center and left guard' },
    { value: '2', description: 'Hole 2 - Between center and right guard' },
    { value: '3', description: 'Hole 3 - Between left guard and left tackle' },
    { value: '4', description: 'Hole 4 - Between right guard and right tackle' },
    { value: '5', description: 'Hole 5 - Outside left tackle' },
    { value: '6', description: 'Hole 6 - Outside right tackle' }
  ]
};

const ballCarrierOptions = [
  { value: 'QB', description: 'Quarterback - QB keeper/scramble' },
  { value: 'RB', description: 'Running Back - Primary ball carrier' },
  { value: 'FB', description: 'Fullback - Power runner' },
  { value: 'WR', description: 'Wide Receiver - End around/jet sweep' }
];

const personnelGroupings = {
  '10': '1 RB, 0 TE, 4 WR - Spread/passing formation',
  '11': '1 RB, 1 TE, 3 WR - Most common balanced formation', 
  '12': '1 RB, 2 TE, 2 WR - Heavy/power running formation',
  '20': '2 RB, 0 TE, 3 WR - Two back set for power',
  '21': '2 RB, 1 TE, 2 WR - Classic I-Formation personnel',
  '22': '2 RB, 2 TE, 1 WR - Goal line/short yardage'
};

const coverageOptions = [
  { value: 'Cover 0', description: 'Cover 0 - Man coverage, no deep safety help' },
  { value: 'Cover 1', description: 'Cover 1 - Man coverage with 1 deep safety' },
  { value: 'Cover 2', description: 'Cover 2 - Zone with 2 deep safeties' },
  { value: 'Cover 3', description: 'Cover 3 - Zone with 3 deep defenders' },
  { value: 'Cover 4', description: 'Cover 4 - Zone with 4 deep defenders (Quarters)' },
  { value: 'Man', description: 'Man - Each defender covers specific receiver' },
  { value: 'Zone', description: 'Zone - Defenders cover areas of field' }
];

const blitzOptions = [
  { value: 'None', description: 'None - Standard pass rush' },
  { value: 'A-Gap', description: 'A-Gap - Blitz through center-guard gaps' },
  { value: 'B-Gap', description: 'B-Gap - Blitz through guard-tackle gaps' },
  { value: 'C-Gap', description: 'C-Gap - Blitz through tackle-end gaps' },
  { value: 'Corner', description: 'Corner - Cornerback blitz from edge' },
  { value: 'Safety', description: 'Safety - Safety blitz from secondary' },
  { value: 'Overload', description: 'Overload - Multiple blitzers from one side' }
];

const formationDescriptions = {
  'Gun Spread 11': '11 Personnel - Shotgun formation with receivers spread across field',
  'Gun Trips Right 11': '11 Personnel - Shotgun with three receivers bunched to right side',
  'I-Formation 21': '21 Personnel - Classic formation with FB and RB behind QB',
  'Gun Empty 10': '10 Personnel - Shotgun with no RB, all 5 receivers spread out',
  'Gun 12 Personnel': '12 Personnel - Shotgun with 2 tight ends for run/pass balance',
  '4-3 Over': '4-Man Front - Strength to tight end side, balanced coverage',
  '4-2-5 Nickel': '4-Man Front - Extra DB for pass coverage situations',
  '3-4 Base': '3-Man Front - More linebackers, versatile vs run/pass',
  '3-3-5 Spread': '3-Man Front - Multiple DBs to defend spread offenses',
  'Kickoff Standard': 'Standard kickoff coverage with lane integrity',
  'Kickoff Onside': 'Onside kick formation to recover ball quickly',
  'Punt Spread': 'Spread punt formation for maximum coverage speed',
  'Punt Shield': 'Shield punt formation for better protection',
  'Field Goal Standard': 'Standard field goal/extra point formation'
};

export default function PlayBuilder({ teamId, teamName }: PlayBuilderProps) {
  const supabase = createClient();
  const [currentPlay, setCurrentPlay] = useState<PlayDiagram>({
    players: [],
    routes: [],
    formation: '',
    odk: 'Offense',
    fieldPosition: { yard: 25, hash: 'middle' }
  });
  const [playName, setPlayName] = useState('');
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPlayType, setSelectedPlayType] = useState('');
  const [selectedCoverage, setSelectedCoverage] = useState('');
  const [selectedBlitz, setSelectedBlitz] = useState('');
  const [selectedSTUnit, setSelectedSTUnit] = useState('');
  const [targetHole, setTargetHole] = useState('');
  const [ballCarrier, setBallCarrier] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{ x: number; y: number }[]>([]);
  const [routeMode, setRouteMode] = useState<'pass' | 'block' | 'motion'>('pass');
  const [selectedRouteType, setSelectedRouteType] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);

  const fieldWidth = 600;
  const fieldHeight = 400;

  const handleODKChange = (odk: 'Offense' | 'Defense' | 'Special Teams') => {
    setCurrentPlay(prev => ({ ...prev, odk, players: [], routes: [] }));
    setSelectedFormation('');
    setSelectedPlayType('');
    setSelectedCoverage('');
    setSelectedBlitz('');
    setSelectedSTUnit('');
  };

  const loadFormation = useCallback((formationName: string) => {
    let formationPlayers: any[] = [];
    
    if (currentPlay.odk === 'Offense') {
      formationPlayers = offensiveFormations[formationName as keyof typeof offensiveFormations] || [];
    } else if (currentPlay.odk === 'Defense') {
      formationPlayers = defensiveFormations[formationName as keyof typeof defensiveFormations] || [];
    } else if (currentPlay.odk === 'Special Teams') {
      formationPlayers = specialTeamsFormations[formationName as keyof typeof specialTeamsFormations] || [];
    }

    if (!formationPlayers.length) return;

    const players: Player[] = formationPlayers.map((player, index) => ({
      id: `${currentPlay.odk.toLowerCase()}-${index}`,
      type: currentPlay.odk === 'Defense' ? 'defense' : 'offense',
      position: player.position,
      x: player.x,
      y: player.y,
      label: player.label
    }));

    setCurrentPlay(prev => ({
      ...prev,
      players,
      formation: formationName,
      routes: []
    }));
    setSelectedFormation(formationName);
  }, [currentPlay.odk]);

  const handlePlayerDrag = useCallback((playerId: string, newX: number, newY: number) => {
    if (!isDragging) return;

    setCurrentPlay(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId
          ? { ...player, x: Math.max(20, Math.min(fieldWidth - 20, newX)), y: Math.max(20, Math.min(fieldHeight - 20, newY)) }
          : player
      )
    }));
  }, [isDragging, fieldWidth, fieldHeight]);

  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingRoute || !selectedPlayer) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentRoute(prev => [...prev, { x, y }]);
  }, [isDrawingRoute, selectedPlayer]);

  const finishRoute = useCallback(() => {
    if (currentRoute.length < 2 || !selectedPlayer) return;

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      playerId: selectedPlayer,
      points: [...currentRoute],
      type: routeMode,
      routeType: routeMode === 'pass' ? selectedRouteType as any : undefined,
      blockType: routeMode === 'block' ? selectedRouteType as any : undefined
    };

    setCurrentPlay(prev => ({
      ...prev,
      routes: [...prev.routes, newRoute]
    }));

    setCurrentRoute([]);
    setIsDrawingRoute(false);
    setSelectedPlayer(null);
    setSelectedRouteType('');
  }, [currentRoute, selectedPlayer, routeMode, selectedRouteType]);

  const startDrawingRoute = useCallback((playerId: string) => {
    const player = currentPlay.players.find(p => p.id === playerId);
    if (!player) return;

    setSelectedPlayer(playerId);
    setIsDrawingRoute(true);
    setCurrentRoute([{ x: player.x, y: player.y }]);
  }, [currentPlay.players]);

  const clearPlay = useCallback(() => {
    setCurrentPlay({
      players: [],
      routes: [],
      formation: '',
      odk: 'Offense',
      fieldPosition: { yard: 25, hash: 'middle' }
    });
    setSelectedFormation('');
    setSelectedPlayType('');
    setSelectedCoverage('');
    setSelectedBlitz('');
    setSelectedSTUnit('');
    setPlayName('');
    setSelectedPlayer(null);
    setCurrentRoute([]);
    setIsDrawingRoute(false);
  }, []);

  const savePlay = async () => {
    if (!playName.trim() || currentPlay.players.length === 0) {
      alert('Please enter a play name and select a formation');
      return;
    }

    try {
      const { data: existingPlays } = await supabase
        .from('playbook_plays')
        .select('play_code')
        .eq('team_id', teamId === 'personal' ? null : teamId)
        .order('play_code', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingPlays && existingPlays.length > 0) {
        const lastCode = existingPlays[0].play_code;
        const match = lastCode?.match(/P-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const playCode = `P-${String(nextNumber).padStart(3, '0')}`;

      // Build attributes object - explicit ODK conversion
      const attributes: any = {
        odk: currentPlay.odk === 'Offense' ? 'offense' : 
             currentPlay.odk === 'Defense' ? 'defense' : 'specialTeams',
        formation: selectedFormation,
        customTags: []
      };

      // Add offense-specific attributes
      if (currentPlay.odk === 'Offense') {
        if (selectedPlayType) attributes.playType = selectedPlayType;
        if (targetHole) attributes.targetHole = targetHole;
        if (ballCarrier) attributes.ballCarrier = ballCarrier;
      }

      // Add defense-specific attributes
      if (currentPlay.odk === 'Defense') {
        if (selectedCoverage) attributes.coverage = selectedCoverage;
        if (selectedBlitz) attributes.blitzType = selectedBlitz;
      }

      // Add special teams attributes
      if (currentPlay.odk === 'Special Teams') {
        if (selectedSTUnit) attributes.unit = selectedSTUnit;
      }

      // Build diagram object
      const diagram: any = {
        players: currentPlay.players,
        routes: currentPlay.routes,
        formation: selectedFormation,
        odk: currentPlay.odk === 'Offense' ? 'offense' : 
             currentPlay.odk === 'Defense' ? 'defense' : 'specialTeams',
        fieldPosition: currentPlay.fieldPosition
      };

      // Add play-specific diagram properties
      if (targetHole) diagram.targetHole = targetHole;
      if (ballCarrier) diagram.ballCarrier = ballCarrier;
      if (selectedPlayType) diagram.playType = selectedPlayType;

      const newPlay = {
        team_id: teamId === 'personal' ? null : teamId,
        play_name: playName.trim(),
        play_code: playCode,
        attributes,
        diagram,
        extraction_confidence: 'drawn',
        is_archived: false
      };

      const { error } = await supabase
        .from('playbook_plays')
        .insert([newPlay]);

      if (error) throw error;

      alert(`Play "${playName}" saved successfully as ${playCode}!`);
      
      clearPlay();

    } catch (error) {
      console.error('Error saving play:', error);
      alert('Error saving play. Please try again.');
    }
  };

  const getFormationOptions = () => {
    if (currentPlay.odk === 'Offense') return Object.keys(offensiveFormations);
    if (currentPlay.odk === 'Defense') return Object.keys(defensiveFormations);
    if (currentPlay.odk === 'Special Teams') return Object.keys(specialTeamsFormations);
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Play Builder - {teamName}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Play Name</label>
            <input
              type="text"
              value={playName}
              onChange={(e) => setPlayName(e.target.value)}
              placeholder="Enter play name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ODK</label>
            <select
              value={currentPlay.odk}
              onChange={(e) => handleODKChange(e.target.value as 'Offense' | 'Defense' | 'Special Teams')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="Offense">Offense</option>
              <option value="Defense">Defense</option>
              <option value="Special Teams">Special Teams</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formation</label>
            <select
              value={selectedFormation}
              onChange={(e) => loadFormation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
              title={selectedFormation ? formationDescriptions[selectedFormation as keyof typeof formationDescriptions] : ''}
            >
              <option value="">Select Formation</option>
              {getFormationOptions().map(formation => (
                <option key={formation} value={formation} title={formationDescriptions[formation as keyof typeof formationDescriptions]}>
                  {formation}
                </option>
              ))}
            </select>
            {selectedFormation && (
              <p className="text-xs text-gray-500 mt-1">
                {formationDescriptions[selectedFormation as keyof typeof formationDescriptions]}
              </p>
            )}
          </div>

          {currentPlay.odk === 'Offense' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Play Type</label>
                <select
                  value={selectedPlayType}
                  onChange={(e) => setSelectedPlayType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">Select Type</option>
                  {playTypeOptions['Offense'].map(type => (
                    <option key={type.value} value={type.value} title={type.description}>
                      {type.value}
                    </option>
                  ))}
                </select>
                {selectedPlayType && (
                  <p className="text-xs text-gray-500 mt-1">
                    {playTypeOptions['Offense'].find(t => t.value === selectedPlayType)?.description}
                  </p>
                )}
              </div>

              {selectedPlayType === 'Run' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Hole</label>
                    <select
                      value={targetHole}
                      onChange={(e) => setTargetHole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                    >
                      <option value="">Select Hole</option>
                      {offensiveHoles['withTE'].map(hole => (
                        <option key={hole.value} value={hole.value} title={hole.description}>
                          {hole.value}
                        </option>
                      ))}
                    </select>
                    {targetHole && (
                      <p className="text-xs text-gray-500 mt-1">
                        {offensiveHoles['withTE'].find(h => h.value === targetHole)?.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ball Carrier</label>
                    <select
                      value={ballCarrier}
                      onChange={(e) => setBallCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                    >
                      <option value="">Select Carrier</option>
                      {ballCarrierOptions.map(carrier => (
                        <option key={carrier.value} value={carrier.value} title={carrier.description}>
                          {carrier.value}
                        </option>
                      ))}
                    </select>
                    {ballCarrier && (
                      <p className="text-xs text-gray-500 mt-1">
                        {ballCarrierOptions.find(c => c.value === ballCarrier)?.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {currentPlay.odk === 'Defense' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage</label>
                <select
                  value={selectedCoverage}
                  onChange={(e) => setSelectedCoverage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">Select Coverage</option>
                  {coverageOptions.map(coverage => (
                    <option key={coverage.value} value={coverage.value} title={coverage.description}>
                      {coverage.value}
                    </option>
                  ))}
                </select>
                {selectedCoverage && (
                  <p className="text-xs text-gray-500 mt-1">
                    {coverageOptions.find(c => c.value === selectedCoverage)?.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blitz</label>
                <select
                  value={selectedBlitz}
                  onChange={(e) => setSelectedBlitz(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">Select Blitz</option>
                  {blitzOptions.map(blitz => (
                    <option key={blitz.value} value={blitz.value} title={blitz.description}>
                      {blitz.value}
                    </option>
                  ))}
                </select>
                {selectedBlitz && (
                  <p className="text-xs text-gray-500 mt-1">
                    {blitzOptions.find(b => b.value === selectedBlitz)?.description}
                  </p>
                )}
              </div>
            </>
          )}

          {currentPlay.odk === 'Special Teams' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ST Unit</label>
              <select
                value={selectedSTUnit}
                onChange={(e) => setSelectedSTUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
              >
                <option value="">Select Unit</option>
                <option value="Kickoff">Kickoff</option>
                <option value="Kick Return">Kick Return</option>
                <option value="Punt">Punt</option>
                <option value="Punt Return">Punt Return</option>
                <option value="Field Goal">Field Goal</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={clearPlay}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={savePlay}
            disabled={!playName.trim() || currentPlay.players.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save Play
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Instructions:</span> 
            {isDrawingRoute 
              ? ` Drawing ${routeMode} route. Click on field to draw path, then click 'Finish Route'`
              : " Select ODK and formation first, then click on players to draw routes or drag to reposition"
            }
          </p>
          {!isDrawingRoute && (
            <div className="mt-3 flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Route Type</label>
                <select
                  value={routeMode}
                  onChange={(e) => setRouteMode(e.target.value as 'pass' | 'block' | 'motion')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="pass">Pass Route</option>
                  <option value="block">Blocking</option>
                  <option value="motion">Motion</option>
                </select>
              </div>
              
              {routeMode === 'pass' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pass Route</label>
                  <select
                    value={selectedRouteType}
                    onChange={(e) => setSelectedRouteType(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                  >
                    <option value="">Select Route</option>
                    <option value="slant">Slant - Quick 45° inside cut</option>
                    <option value="out">Out - 90° cut to sideline</option>
                    <option value="go">Go - Straight upfield</option>
                    <option value="post">Post - Deep cut to goal posts</option>
                    <option value="hitch">Hitch - Stop and turn back</option>
                    <option value="drag">Drag - Shallow cross</option>
                    <option value="comeback">Comeback - Deep return to QB</option>
                    <option value="corner">Corner - Break to corner</option>
                    <option value="seam">Seam - Up the middle</option>
                    <option value="flat">Flat - Quick to sideline</option>
                  </select>
                </div>
              )}
              
              {routeMode === 'block' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Block Type</label>
                  <select
                    value={selectedRouteType}
                    onChange={(e) => setSelectedRouteType(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                  >
                    <option value="">Select Block</option>
                    <option value="zone">Zone - Block area/gap</option>
                    <option value="man">Man - Block specific defender</option>
                    <option value="combo">Combo - Double team block</option>
                    <option value="pull">Pull - Move to different gap</option>
                    <option value="pass-pro">Pass Pro - Pass protection</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="relative">
          <svg
            ref={svgRef}
            width={fieldWidth}
            height={fieldHeight}
            viewBox={`0 0 ${fieldWidth} ${fieldHeight}`}
            className="border border-gray-300 cursor-crosshair"
            onClick={handleSVGClick}
          >
            <rect width={fieldWidth} height={fieldHeight} fill="#4ade80" />
            
            {Array.from({ length: 5 }, (_, i) => {
              const y = 40 + i * 80;
              const yardNumber = 10 + i * 10;
              return (
                <g key={`yard-${i}`}>
                  <line x1={0} y1={y} x2={fieldWidth} y2={y} stroke="white" strokeWidth="2" />
                  <text x={30} y={y - 5} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">{yardNumber}</text>
                  <text x={fieldWidth - 30} y={y - 5} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">{yardNumber}</text>
                </g>
              );
            })}
            
            {Array.from({ length: 9 }, (_, i) => {
              const y = 40 + i * 40;
              if (i % 2 !== 0) {
                return <line key={`5yard-${i}`} x1={0} y1={y} x2={fieldWidth} y2={y} stroke="white" strokeWidth="1" opacity="0.6" />;
              }
              return null;
            })}
            
            {Array.from({ length: 45 }, (_, i) => {
              const y = 8 + i * 8.7;
              return (
                <g key={`hash-${i}`}>
                  <line x1={fieldWidth * 0.3} y1={y} x2={fieldWidth * 0.32} y2={y} stroke="white" strokeWidth="1" opacity="0.4" />
                  <line x1={fieldWidth * 0.68} y1={y} x2={fieldWidth * 0.7} y2={y} stroke="white" strokeWidth="1" opacity="0.4" />
                </g>
              );
            })}
            
            <line x1={fieldWidth * 0.31} y1={0} x2={fieldWidth * 0.31} y2={fieldHeight} stroke="white" strokeWidth="1" opacity="0.3" />
            <line x1={fieldWidth * 0.69} y1={0} x2={fieldWidth * 0.69} y2={fieldHeight} stroke="white" strokeWidth="1" opacity="0.3" />
            
            <line x1={0} y1={fieldHeight/2} x2={fieldWidth} y2={fieldHeight/2} stroke="white" strokeWidth="3" />
            <text x={fieldWidth/2} y={fieldHeight/2 - 8} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">50</text>
            
            <line x1={0} y1={fieldHeight * 0.8} x2={fieldWidth} y2={fieldHeight * 0.8} stroke="yellow" strokeWidth="3" />
            <text x={fieldWidth/2} y={fieldHeight * 0.8 - 5} fill="yellow" fontSize="12" fontWeight="bold" textAnchor="middle">Line of Scrimmage</text>
            
            {currentPlay.odk === 'Offense' && selectedPlayType === 'Run' && (
              <g>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num, idx) => (
                  <g key={num}>
                    <circle cx={230 + idx * 40} cy={fieldHeight * 0.8} r="12" fill="rgba(255,255,255,0.8)" stroke="black" strokeWidth="1" />
                    <text x={230 + idx * 40} y={fieldHeight * 0.8 + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="black">{num}</text>
                  </g>
                ))}
                {targetHole && (
                  <circle 
                    cx={230 + (parseInt(targetHole) - 1) * 40} 
                    cy={fieldHeight * 0.8} 
                    r="16" 
                    fill="none" 
                    stroke="red" 
                    strokeWidth="3"
                  />
                )}
              </g>
            )}
            
            <text x={10} y={30} fill="white" fontSize="14" fontWeight="bold">← Defense</text>
            <text x={10} y={fieldHeight - 10} fill="white" fontSize="14" fontWeight="bold">← Offense</text>
            
            {currentPlay.players.map((player) => (
              <g key={player.id}>
                {player.type === 'offense' ? (
                  <circle
                    cx={player.x}
                    cy={player.y}
                    r="12"
                    fill="white"
                    stroke="black"
                    strokeWidth="2"
                    className="cursor-move hover:fill-blue-100"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseMove={(e) => {
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect && isDragging) {
                        handlePlayerDrag(player.id, e.clientX - rect.left, e.clientY - rect.top);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDrawingRoute) {
                        startDrawingRoute(player.id);
                      }
                    }}
                  />
                ) : (
                  <rect
                    x={player.x - 12}
                    y={player.y - 12}
                    width="24"
                    height="24"
                    fill="red"
                    stroke="black"
                    strokeWidth="2"
                    className="cursor-move hover:fill-red-400"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseMove={(e) => {
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect && isDragging) {
                        handlePlayerDrag(player.id, e.clientX - rect.left, e.clientY - rect.top);
                      }
                    }}
                  />
                )}
                <text x={player.x} y={player.y + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="black" pointerEvents="none">
                  {player.label}
                </text>
              </g>
            ))}
            
            {currentPlay.routes.map((route) => {
              const getRouteColor = () => {
                switch (route.type) {
                  case 'pass': return '#0066CC';
                  case 'block': return '#CC0000';
                  case 'motion': return '#9900CC';
                  default: return '#0066CC';
                }
              };
              
              const getRouteStyle = () => {
                if (route.type === 'block') {
                  return route.blockType === 'zone' ? '5,5' : '0';
                }
                if (route.type === 'motion') {
                  return '3,3';
                }
                return '0';
              };
              
              const getRouteWidth = () => {
                return route.type === 'block' ? '4' : '3';
              };
              
              const createSmoothPath = (points: {x: number, y: number}[]) => {
                if (points.length < 2) return '';
                
                let path = `M ${points[0].x} ${points[0].y}`;
                
                for (let i = 1; i < points.length; i++) {
                  if (i === points.length - 1) {
                    path += ` L ${points[i].x} ${points[i].y}`;
                  } else {
                    const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.5;
                    const cp1y = points[i-1].y + (points[i].y - points[i-1].y) * 0.3;
                    const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.3;
                    const cp2y = points[i].y - (points[i].y - points[i-1].y) * 0.5;
                    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
                  }
                }
                return path;
              };
              
              return (
                <g key={route.id}>
                  <path
                    d={createSmoothPath(route.points)}
                    fill="none"
                    stroke={getRouteColor()}
                    strokeWidth={getRouteWidth()}
                    strokeDasharray={getRouteStyle()}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {route.points.length > 1 && (
                    <g>
                      {(() => {
                        const lastPoint = route.points[route.points.length - 1];
                        const secondLastPoint = route.points[route.points.length - 2];
                        const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x) * 180 / Math.PI;
                        
                        return (
                          <polygon
                            points="-8,-4 0,0 -8,4 -6,0"
                            fill={getRouteColor()}
                            stroke={getRouteColor()}
                            strokeWidth="1"
                            transform={`translate(${lastPoint.x},${lastPoint.y}) rotate(${angle})`}
                          />
                        );
                      })()}
                    </g>
                  )}
                  
                  {route.points.length > 1 && (route.routeType || route.blockType) && (
                    <text
                      x={route.points[route.points.length - 1].x + 12}
                      y={route.points[route.points.length - 1].y - 8}
                      fontSize="9"
                      fill={getRouteColor()}
                      fontWeight="bold"
                      stroke="white"
                      strokeWidth="0.5"
                    >
                      {route.routeType || route.blockType}
                    </text>
                  )}
                </g>
              );
            })}
            
            {currentRoute.length > 1 && (
              <g>
                <path
                  d={(() => {
                    let path = `M ${currentRoute[0].x} ${currentRoute[0].y}`;
                    for (let i = 1; i < currentRoute.length; i++) {
                      path += ` L ${currentRoute[i].x} ${currentRoute[i].y}`;
                    }
                    return path;
                  })()}
                  fill="none"
                  stroke="#FF6600"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
          
          {isDrawingRoute && (
            <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
              <button
                onClick={finishRoute}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 mr-2"
              >
                Finish Route
              </button>
              <button
                onClick={() => {
                  setIsDrawingRoute(false);
                  setCurrentRoute([]);
                  setSelectedPlayer(null);
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}