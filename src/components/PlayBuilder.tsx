'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { PlayAttributes, PlayDiagram } from '@/types/football';
import {
  OFFENSIVE_FORMATIONS,
  DEFENSIVE_FORMATIONS,
  SPECIAL_TEAMS_FORMATIONS,
  OFFENSIVE_ATTRIBUTES,
  DEFENSIVE_ATTRIBUTES,
  SPECIAL_TEAMS_ATTRIBUTES,
  BLOCKING_ASSIGNMENTS,
  BLOCK_RESPONSIBILITIES,
  PASSING_ROUTES,
  RUNNING_HOLES,
  getAttributeOptions,
  getAssignmentOptions,
  POSITION_GROUPS,
  FORMATION_METADATA
} from '@/config/footballConfig';
import {
  validateOffensiveFormation,
  validateDefensiveFormation,
  checkIllegalFormation,
  checkOffsides,
  getValidationSummary,
  type FormationValidation
} from '@/config/footballRules';

interface Player {
  id: string;
  x: number;
  y: number;
  label: string;
  position: string;
  side: 'offense' | 'defense';
  assignment?: string;
  blockType?: string;
  blockResponsibility?: string;
  isPrimary?: boolean;
}

interface Route {
  id: string;
  playerId: string;
  points: Array<{ x: number; y: number }>;
  assignment?: string;
  isPrimary?: boolean;
}

interface PlayBuilderProps {
  teamId: string;
  teamName?: string;
  existingPlay?: {
    id: string;
    play_code: string;
    play_name: string;
    attributes: PlayAttributes;
    diagram: PlayDiagram;
  };
  onSave?: () => void;
}

export default function PlayBuilder({ teamId, teamName, existingPlay, onSave }: PlayBuilderProps) {
  const supabase = createClient();
  const [playName, setPlayName] = useState(existingPlay?.play_name || '');
  const [playCode, setPlayCode] = useState(existingPlay?.play_code || '');
  
  const [odk, setOdk] = useState<'offense' | 'defense' | 'specialTeams'>(
    existingPlay?.attributes.odk || 'offense'
  );
  
  const [formation, setFormation] = useState(existingPlay?.attributes.formation || '');
  const [playType, setPlayType] = useState(existingPlay?.attributes.playType || '');
  const [targetHole, setTargetHole] = useState(existingPlay?.attributes.targetHole || '');
  const [ballCarrier, setBallCarrier] = useState(existingPlay?.attributes.ballCarrier || '');
  
  const [coverage, setCoverage] = useState(existingPlay?.attributes.coverage || '');
  const [blitzType, setBlitzType] = useState(existingPlay?.attributes.blitzType || '');
  const [front, setFront] = useState(existingPlay?.attributes.front || '');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  
  // Drawing custom routes
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Array<{ x: number; y: number }>>([]);
  
  // Default collapsed sections
  const [showFormationMetadata, setShowFormationMetadata] = useState(true);
  const [showLinemenSection, setShowLinemenSection] = useState(false);
  const [showBacksSection, setShowBacksSection] = useState(false);
  const [showReceiversSection, setShowReceiversSection] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<FormationValidation | null>(null);
  const [saveAnywayConfirmed, setSaveAnywayConfirmed] = useState(false);

  const attributeOptions = getAttributeOptions(odk);

  const formationList = useCallback(() => {
    switch (odk) {
      case 'offense':
        return Object.keys(OFFENSIVE_FORMATIONS);
      case 'defense':
        return Object.keys(DEFENSIVE_FORMATIONS);
      case 'specialTeams':
        return Object.keys(SPECIAL_TEAMS_FORMATIONS);
      default:
        return [];
    }
  }, [odk]);

  useEffect(() => {
    if (existingPlay?.diagram) {
      setPlayers(existingPlay.diagram.players.map((p, idx) => ({
        id: `player-${idx}`,
        x: p.x,
        y: p.y,
        label: p.label,
        position: p.position,
        side: existingPlay.diagram.odk === 'defense' ? 'defense' : 'offense',
        assignment: p.assignment,
        blockType: p.blockType,
        blockResponsibility: p.blockResponsibility,
        isPrimary: p.isPrimary || false
      })));
      setRoutes(existingPlay.diagram.routes || []);
    }
  }, [existingPlay]);

  useEffect(() => {
    if (!existingPlay && !playCode) {
      const generateCode = async () => {
        const { data, error } = await supabase
          .from('playbook_plays')
          .select('play_code')
          .eq('team_id', teamId === 'personal' ? null : teamId)
          .order('play_code', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error generating play code:', error);
          setPlayCode('P-001');
          return;
        }

        if (data && data.length > 0) {
          const lastCode = data[0].play_code;
          const match = lastCode.match(/P-(\d+)/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            setPlayCode(`P-${nextNum.toString().padStart(3, '0')}`);
          } else {
            setPlayCode('P-001');
          }
        } else {
          setPlayCode('P-001');
        }
      };
      generateCode();
    }
  }, [existingPlay, playCode, teamId, supabase]);

  const loadFormation = (formationName: string) => {
    let formationData;
    
    if (odk === 'offense') {
      formationData = OFFENSIVE_FORMATIONS[formationName];
    } else if (odk === 'defense') {
      formationData = DEFENSIVE_FORMATIONS[formationName];
    } else {
      formationData = SPECIAL_TEAMS_FORMATIONS[formationName];
    }

    if (formationData) {
      const centerX = 350;
      const formationCenter = formationData.reduce((sum, pos) => sum + pos.x, 0) / formationData.length;
      const offset = centerX - formationCenter;

      const newPlayers: Player[] = formationData.map((pos, idx) => ({
        id: `${odk}-${idx}`,
        x: pos.x + offset,
        y: pos.y,
        label: pos.label,
        position: pos.position,
        side: odk === 'defense' ? 'defense' : 'offense',
        isPrimary: false
      }));
      
      setPlayers(newPlayers);
      setRoutes([]);
    }
  };

  // Auto-generate route path based on route type
  const generateRoutePath = (player: Player, routeType: string): Array<{ x: number; y: number }> => {
    const startX = player.x;
    const startY = player.y;
    const lineOfScrimmage = 200;
    const isLeftSide = startX < 350;

    const routeName = routeType.split('/')[0];

    switch (routeName) {
      case 'Go':
      case 'Streak':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 100 }
        ];
      
      case 'Post':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 50 },
          { x: 350, y: lineOfScrimmage - 100 }
        ];
      
      case 'Corner':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 50 },
          { x: isLeftSide ? startX - 60 : startX + 60, y: lineOfScrimmage - 100 }
        ];
      
      case 'Out':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 40 },
          { x: isLeftSide ? startX - 80 : startX + 80, y: lineOfScrimmage - 40 }
        ];
      
      case 'In':
      case 'Dig':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 40 },
          { x: 350, y: lineOfScrimmage - 40 }
        ];
      
      case 'Slant':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 15 },
          { x: isLeftSide ? startX + 40 : startX - 40, y: lineOfScrimmage - 45 }
        ];
      
      case 'Hitch':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 30 },
          { x: startX, y: lineOfScrimmage - 25 }
        ];
      
      case 'Flat':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 10 },
          { x: isLeftSide ? startX - 60 : startX + 60, y: lineOfScrimmage - 15 }
        ];
      
      case 'Wheel':
        return [
          { x: startX, y: startY },
          { x: isLeftSide ? startX - 30 : startX + 30, y: lineOfScrimmage - 10 },
          { x: isLeftSide ? startX - 50 : startX + 50, y: lineOfScrimmage - 30 },
          { x: isLeftSide ? startX - 60 : startX + 60, y: lineOfScrimmage - 80 }
        ];

      case 'Curl':
      case 'Comeback':
        return [
          { x: startX, y: startY },
          { x: startX, y: lineOfScrimmage - 50 },
          { x: startX, y: lineOfScrimmage - 45 }
        ];

      case 'Seam':
        return [
          { x: startX, y: startY },
          { x: startX + (isLeftSide ? 20 : -20), y: lineOfScrimmage - 100 }
        ];

      case 'Fade':
        return [
          { x: startX, y: startY },
          { x: isLeftSide ? startX - 20 : startX + 20, y: lineOfScrimmage - 80 }
        ];
      
      default:
        return [{ x: startX, y: startY }];
    }
  };

  // Auto-generate routes when assignment changes (except custom draw)
  useEffect(() => {
    const newRoutes: Route[] = [];
    
    players.forEach(player => {
      if (player.assignment && player.assignment !== 'Block' && player.assignment !== 'Draw Route (Custom)' && playType === 'Pass') {
        const routePath = generateRoutePath(player, player.assignment);
        if (routePath.length > 1) {
          // Preserve existing isPrimary status from current routes
          const existingRoute = routes.find(r => r.playerId === player.id);
          newRoutes.push({
            id: `route-${player.id}`,
            playerId: player.id,
            points: routePath,
            assignment: player.assignment,
            isPrimary: existingRoute?.isPrimary || player.isPrimary || false
          });
        }
      }
    });
    
    // Keep manually drawn routes with their isPrimary status preserved
    const manualRoutes = routes.filter(r => {
      const player = players.find(p => p.id === r.playerId);
      return player?.assignment === 'Draw Route (Custom)';
    });
    
    setRoutes([...newRoutes, ...manualRoutes]);
  }, [players, playType]);

  const handleMouseDown = (playerId: string) => {
    if (isDrawingRoute) return;
    setDraggedPlayer(playerId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !draggedPlayer) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPlayers(prev =>
      prev.map(p =>
        p.id === draggedPlayer ? { ...p, x, y } : p
      )
    );
  }, [draggedPlayer]);

  const handleMouseUp = () => {
    setDraggedPlayer(null);
  };

  const handleFieldClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !isDrawingRoute || !selectedPlayer) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentRoute(prev => [...prev, { x, y }]);
  };

  const handleFieldDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingRoute || !selectedPlayer || currentRoute.length < 2) return;
    
    const player = players.find(p => p.id === selectedPlayer);
    const filteredRoutes = routes.filter(r => r.playerId !== selectedPlayer);
    
    setRoutes([
      ...filteredRoutes,
      {
        id: `route-${Date.now()}`,
        playerId: selectedPlayer,
        points: [...currentRoute],
        assignment: player?.assignment,
        isPrimary: player?.isPrimary || false
      }
    ]);
    
    setIsDrawingRoute(false);
    setCurrentRoute([]);
    setSelectedPlayer(null);
  };

  const startCustomRoute = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setSelectedPlayer(playerId);
    setIsDrawingRoute(true);
    setCurrentRoute([{ x: player.x, y: player.y }]);
  };

  const cancelCustomRoute = () => {
    setIsDrawingRoute(false);
    setCurrentRoute([]);
    setSelectedPlayer(null);
  };

  const updatePlayerAssignment = (playerId: string, assignment: string) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, assignment } : p
      )
    );

    if (assignment === 'Draw Route (Custom)') {
      setTimeout(() => startCustomRoute(playerId), 100);
    } else {
      setRoutes(prev => prev.filter(r => r.playerId !== playerId));
    }
  };

  const updatePlayerBlockType = (playerId: string, blockType: string) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, blockType } : p
      )
    );
  };

  const updatePlayerBlockResponsibility = (playerId: string, blockResponsibility: string) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, blockResponsibility } : p
      )
    );
  };

  const togglePrimaryReceiver = (playerId: string) => {
    setPlayers(prev =>
      prev.map(p => ({
        ...p,
        isPrimary: p.id === playerId ? !p.isPrimary : false
      }))
    );

    setRoutes(prev =>
      prev.map(r => {
        if (r.playerId === playerId) {
          return { ...r, isPrimary: !r.isPrimary };
        } else {
          return { ...r, isPrimary: false };
        }
      })
    );
  };

  const getHolePosition = (hole: string): { x: number; y: number } => {
    const linemen = players.filter(p => getPositionGroup(p.position) === 'linemen');
    const sortedLinemen = [...linemen].sort((a, b) => a.x - b.x);
    
    if (sortedLinemen.length < 2) {
      return { x: 350, y: 195 };
    }

    const center = linemen.find(p => p.position === 'C');
    const lg = linemen.find(p => p.position === 'LG');
    const rg = linemen.find(p => p.position === 'RG');
    const lt = linemen.find(p => p.position === 'LT');
    const rt = linemen.find(p => p.position === 'RT');
    
    const centerX = center?.x || 350;
    const lineOfScrimmage = 200;
    const holeY = lineOfScrimmage - 5;

    const holeMatch = hole.match(/^(\d)/);
    const holeNum = holeMatch ? holeMatch[1] : hole.charAt(0);

    switch (holeNum) {
      case '1':
        if (lg && center) {
          return { x: (center.x + lg.x) / 2, y: holeY };
        }
        return { x: centerX - 20, y: holeY };
        
      case '2':
        if (rg && center) {
          return { x: (center.x + rg.x) / 2, y: holeY };
        }
        return { x: centerX + 20, y: holeY };
        
      case '3':
        if (lg && lt) {
          return { x: (lg.x + lt.x) / 2, y: holeY };
        }
        return { x: centerX - 60, y: holeY };
        
      case '4':
        if (rg && rt) {
          return { x: (rg.x + rt.x) / 2, y: holeY };
        }
        return { x: centerX + 60, y: holeY };
        
      case '5':
        if (lt) {
          return { x: lt.x - 30, y: holeY };
        }
        return { x: centerX - 100, y: holeY };
        
      case '6':
        if (rt) {
          return { x: rt.x + 30, y: holeY };
        }
        return { x: centerX + 100, y: holeY };
        
      case '7':
        return { x: sortedLinemen[0].x - 60, y: holeY };
        
      case '8':
        return { x: sortedLinemen[sortedLinemen.length - 1].x + 60, y: holeY };
        
      default:
        return { x: centerX, y: holeY };
    }
  };

  const getBlockingArrowDirection = (player: Player): { endX: number; endY: number } | null => {
    if (!player.blockType && !player.blockResponsibility) return null;

    const baseLength = 30;
    let angle = -45;

    if (player.blockType === 'Down') {
      angle = -60;
    } else if (player.blockType === 'Reach') {
      angle = -30;
    } else if (player.blockType === 'Pull') {
      const direction = player.blockResponsibility?.includes('Left') ? -1 : 1;
      return {
        endX: player.x + (baseLength * 1.5 * direction),
        endY: player.y
      };
    }

    const radians = (angle * Math.PI) / 180;
    return {
      endX: player.x + baseLength * Math.cos(radians),
      endY: player.y + baseLength * Math.sin(radians)
    };
  };

  const renderBallCarrierArrow = (player: Player) => {
    if (playType !== 'Run' || !targetHole || player.label !== ballCarrier) return null;

    const holePos = getHolePosition(targetHole);
    const startX = player.x;
    const startY = player.y;
    const endX = holePos.x;
    const endY = holePos.y;

    let pathD = `M ${startX} ${startY}`;
    const midY = Math.max(startY, 205);
    pathD += ` L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;

    return (
      <g key={`ball-carrier-${player.id}`}>
        <defs>
          <marker
            id={`arrowhead-ball-${player.id}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#FF0000" />
          </marker>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="#FF0000"
          strokeWidth="2.5"
          markerEnd={`url(#arrowhead-ball-${player.id})`}
        />
      </g>
    );
  };

  const renderBlockingArrow = (player: Player) => {
    if (!player.blockType && !player.blockResponsibility) return null;

    const arrowEnd = getBlockingArrowDirection(player);
    if (!arrowEnd) return null;

    const dx = arrowEnd.endX - player.x;
    const dy = arrowEnd.endY - player.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length * 8;
    const perpY = dx / length * 8;

    return (
      <g key={`block-${player.id}`}>
        <line
          x1={player.x}
          y1={player.y}
          x2={arrowEnd.endX}
          y2={arrowEnd.endY}
          stroke="#888888"
          strokeWidth="2"
        />
        <line
          x1={arrowEnd.endX - perpX}
          y1={arrowEnd.endY - perpY}
          x2={arrowEnd.endX + perpX}
          y2={arrowEnd.endY + perpY}
          stroke="#888888"
          strokeWidth="2"
        />
      </g>
    );
  };

  const renderPassRoute = (route: Route) => {
    const player = players.find(p => p.id === route.playerId);
    if (!player || route.points.length < 2) return null;

    let pathD = `M ${route.points[0].x} ${route.points[0].y}`;
    for (let i = 1; i < route.points.length; i++) {
      pathD += ` L ${route.points[i].x} ${route.points[i].y}`;
    }

    const color = route.isPrimary ? '#FF0000' : '#FFD700';

    return (
      <g key={route.id}>
        <defs>
          <marker
            id={`arrowhead-route-${route.id}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill={color} />
          </marker>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          markerEnd={`url(#arrowhead-route-${route.id})`}
        />
        {route.assignment && route.assignment !== 'Draw Route (Custom)' && (
          <text
            x={route.points[route.points.length - 1].x + 10}
            y={route.points[route.points.length - 1].y - 6}
            fontSize="9"
            fill={color}
            fontWeight="bold"
          >
            {route.assignment.split('/')[0]}
          </text>
        )}
      </g>
    );
  };

  const getPositionGroup = (position: string): 'linemen' | 'backs' | 'receivers' => {
    if (POSITION_GROUPS.linemen.includes(position)) return 'linemen';
    if (POSITION_GROUPS.backs.includes(position)) return 'backs';
    return 'receivers';
  };

  const getAssignmentOptionsForPlayer = (player: Player): string[] => {
    const group = getPositionGroup(player.position);
    
    if (playType === 'Run') {
      if (group === 'linemen') return [];
      if (group === 'backs') return ['Block', ...PASSING_ROUTES, 'Draw Route (Custom)'];
      if (group === 'receivers') return ['Block', ...PASSING_ROUTES, 'Draw Route (Custom)'];
    } else if (playType === 'Pass') {
      if (group === 'linemen') return [];
      if (group === 'backs') return ['Block', ...PASSING_ROUTES, 'Draw Route (Custom)'];
      if (group === 'receivers') return [...PASSING_ROUTES, 'Draw Route (Custom)'];
    }
    
    return [];
  };

  const savePlay = async () => {
    if (!playName.trim()) {
      alert('Please enter a play name');
      return;
    }

    if (!formation) {
      alert('Please select a formation');
      return;
    }

    if (!saveAnywayConfirmed && odk === 'offense') {
      const validation = validateOffensiveFormation(players);
      const illegalFormation = checkIllegalFormation(players);
      const offsidesCheck = checkOffsides(players, 'offense');
      
      const combinedValidation: FormationValidation = {
        isValid: validation.isValid && illegalFormation.isValid && offsidesCheck.isValid,
        errors: [...validation.errors, ...illegalFormation.errors, ...offsidesCheck.errors],
        warnings: [...validation.warnings, ...illegalFormation.warnings, ...offsidesCheck.warnings]
      };
      
      if (!combinedValidation.isValid || combinedValidation.warnings.length > 0) {
        setValidationResult(combinedValidation);
        setShowValidationModal(true);
        return;
      }
    } else if (!saveAnywayConfirmed && odk === 'defense') {
      const validation = validateDefensiveFormation(players);
      const offsidesCheck = checkOffsides(players, 'defense');
      
      const combinedValidation: FormationValidation = {
        isValid: validation.isValid && offsidesCheck.isValid,
        errors: [...validation.errors, ...offsidesCheck.errors],
        warnings: [...validation.warnings, ...offsidesCheck.warnings]
      };
      
      if (!combinedValidation.isValid || combinedValidation.warnings.length > 0) {
        setValidationResult(combinedValidation);
        setShowValidationModal(true);
        return;
      }
    }

    setIsSaving(true);
    setSaveAnywayConfirmed(false);

    const diagram: PlayDiagram = {
      players: players.map(p => ({
        position: p.position,
        x: p.x,
        y: p.y,
        label: p.label,
        assignment: p.assignment,
        blockType: p.blockType,
        blockResponsibility: p.blockResponsibility,
        isPrimary: p.isPrimary
      })),
      routes: routes.map(r => ({
        id: r.id,
        playerId: r.playerId,
        path: r.points,
        type: playType === 'Pass' ? 'pass' : 'run',
        routeType: r.assignment,
        isPrimary: r.isPrimary
      })),
      formation,
      odk
    };

    const attributes: PlayAttributes = {
      odk,
      formation,
      playType: playType || undefined,
      targetHole: targetHole || undefined,
      ballCarrier: ballCarrier || undefined,
      coverage: coverage || undefined,
      blitzType: blitzType || undefined,
      front: front || undefined
    };

    try {
      if (existingPlay) {
        const { error } = await supabase
          .from('playbook_plays')
          .update({
            play_name: playName,
            attributes,
            diagram,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlay.id);

        if (error) throw error;
        alert('Play updated successfully!');
      } else {
        const { error } = await supabase
          .from('playbook_plays')
          .insert({
            team_id: teamId === 'personal' ? null : teamId,
            play_code: playCode,
            play_name: playName,
            attributes,
            diagram
          });

        if (error) throw error;
        alert('Play saved successfully!');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving play:', error);
      alert('Error saving play. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnyway = () => {
    setSaveAnywayConfirmed(true);
    setShowValidationModal(false);
    setTimeout(() => savePlay(), 100);
  };

  const availableFormations = formationList();
  const linemen = players.filter(p => getPositionGroup(p.position) === 'linemen');
  const backs = players.filter(p => getPositionGroup(p.position) === 'backs');
  const receivers = players.filter(p => getPositionGroup(p.position) === 'receivers');
  
  const potentialBallCarriers = players.filter(p => getPositionGroup(p.position) !== 'linemen');

  return (
    <div className="space-y-6">
      {/* TWO-COLUMN LAYOUT: Forms Left, Diagram Right (Sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========== LEFT COLUMN: All Forms ========== */}
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {existingPlay ? 'Edit Play' : 'Create New Play'}
                </h2>
                {teamName && (
                  <p className="text-sm text-gray-600 mt-1">Team: {teamName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Play Code</p>
                <p className="text-2xl font-bold text-gray-900">{playCode}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Play Name *
              </label>
              <input
                type="text"
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="e.g., 22 Power, Cover 2 Blitz"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Type (ODK) *
                </label>
                <select
                  value={odk}
                  onChange={(e) => {
                    setOdk(e.target.value as 'offense' | 'defense' | 'specialTeams');
                    setFormation('');
                    setPlayers([]);
                    setRoutes([]);
                    setPlayType('');
                    setTargetHole('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="offense">Offense</option>
                  <option value="defense">Defense</option>
                  <option value="specialTeams">Special Teams</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Formation * ({availableFormations.length} available)
                </label>
                <select
                  value={formation}
                  onChange={(e) => {
                    setFormation(e.target.value);
                    if (e.target.value) loadFormation(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">Select Formation...</option>
                  {availableFormations.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {odk === 'offense' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Play Type *
                  </label>
                  <select
                    value={playType}
                    onChange={(e) => {
                      setPlayType(e.target.value);
                      setTargetHole('');
                      setBallCarrier('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select...</option>
                    {OFFENSIVE_ATTRIBUTES.playType.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Hole and Ball Carrier for Run Plays */}
            {odk === 'offense' && playType === 'Run' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Target Hole *
                  </label>
                  <select
                    value={targetHole}
                    onChange={(e) => setTargetHole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select hole...</option>
                    {RUNNING_HOLES.map(hole => (
                      <option key={hole.charAt(0)} value={hole}>{hole}</option>
                    ))}
                  </select>
                </div>
                
                {targetHole && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Ball Carrier *
                    </label>
                    <select
                      value={ballCarrier}
                      onChange={(e) => setBallCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="">Select ball carrier...</option>
                      {potentialBallCarriers.map(player => (
                        <option key={player.id} value={player.label}>{player.label} ({player.position})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Formation Metadata Display */}
            {formation && odk === 'offense' && FORMATION_METADATA[formation] && (
              <div className="mb-4 border border-blue-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowFormationMetadata(!showFormationMetadata)}
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-3 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900">Formation Info: {formation}</h4>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${showFormationMetadata ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFormationMetadata && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-2">
                          {FORMATION_METADATA[formation].usage}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-600 mb-1">
                          {FORMATION_METADATA[formation].personnel}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                            Run {FORMATION_METADATA[formation].runPercent}%
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
                            Pass {FORMATION_METADATA[formation].passPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-green-700">✓ Strengths:</span>
                        <p className="text-gray-700 mt-1">
                          {FORMATION_METADATA[formation].strengths}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-red-700">⚠ Weaknesses:</span>
                        <p className="text-gray-700 mt-1">
                          {FORMATION_METADATA[formation].weaknesses}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span className="text-xs font-semibold text-gray-700">Common Plays: </span>
                      <span className="text-xs text-gray-600">
                        {FORMATION_METADATA[formation].commonPlays.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Defense Attributes */}
            {odk === 'defense' && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Front
                  </label>
                  <select
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select...</option>
                    {DEFENSIVE_ATTRIBUTES.front.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Coverage
                  </label>
                  <select
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select...</option>
                    {DEFENSIVE_ATTRIBUTES.coverage.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Blitz Type
                  </label>
                  <select
                    value={blitzType}
                    onChange={(e) => setBlitzType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="">Select...</option>
                    {DEFENSIVE_ATTRIBUTES.blitzType.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Position Assignments Section */}
          {odk === 'offense' && playType && players.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Player Assignments</h3>
              
              {/* Offensive Linemen */}
              {linemen.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowLinemenSection(!showLinemenSection)}
                    className="w-full bg-gray-50 p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">Offensive Line ({linemen.length})</h4>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${showLinemenSection ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showLinemenSection && (
                    <div className="p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {linemen.map(player => (
                          <div key={player.id} className="bg-white p-3 rounded border border-gray-200">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              {player.label}
                            </label>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Block Type</label>
                                <select
                                  value={player.blockType || ''}
                                  onChange={(e) => updatePlayerBlockType(player.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                >
                                  <option value="">Select...</option>
                                  {BLOCKING_ASSIGNMENTS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Responsibility</label>
                                <select
                                  value={player.blockResponsibility || ''}
                                  onChange={(e) => updatePlayerBlockResponsibility(player.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                >
                                  <option value="">Select...</option>
                                  {BLOCK_RESPONSIBILITIES.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* QB & Backs */}
              {backs.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowBacksSection(!showBacksSection)}
                    className="w-full bg-blue-50 p-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">QB & Backs ({backs.length})</h4>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${showBacksSection ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showBacksSection && (
                    <div className="p-4 bg-blue-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {backs.map(player => (
                          <div key={player.id}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {player.label}
                            </label>
                            <select
                              value={player.assignment || ''}
                              onChange={(e) => updatePlayerAssignment(player.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 mb-1"
                            >
                              <option value="">Select...</option>
                              {getAssignmentOptionsForPlayer(player).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            {playType === 'Pass' && player.assignment && player.assignment !== 'Block' && (
                              <label className="flex items-center text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={player.isPrimary || false}
                                  onChange={() => togglePrimaryReceiver(player.id)}
                                  className="w-3 h-3 mr-1"
                                />
                                Primary (red route)
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Receivers */}
              {receivers.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowReceiversSection(!showReceiversSection)}
                    className="w-full bg-green-50 p-3 flex items-center justify-between hover:bg-green-100 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900">Receivers ({receivers.length})</h4>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${showReceiversSection ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showReceiversSection && (
                    <div className="p-4 bg-green-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {receivers.map(player => (
                          <div key={player.id}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {player.label}
                            </label>
                            <select
                              value={player.assignment || ''}
                              onChange={(e) => updatePlayerAssignment(player.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 mb-1"
                            >
                              <option value="">Select...</option>
                              {getAssignmentOptionsForPlayer(player).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            {playType === 'Pass' && player.assignment && player.assignment !== 'Block' && (
                              <label className="flex items-center text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={player.isPrimary || false}
                                  onChange={() => togglePrimaryReceiver(player.id)}
                                  className="w-3 h-3 mr-1"
                                />
                                Primary (red route)
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save Button - Bottom of Left Column */}
          <div className="flex justify-end">
            <button
              onClick={savePlay}
              disabled={isSaving}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {isSaving ? 'Saving...' : existingPlay ? 'Update Play' : 'Save Play'}
            </button>
          </div>

        </div>
        {/* ========== END LEFT COLUMN ========== */}

        {/* ========== RIGHT COLUMN: Sticky Diagram ========== */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Play Diagram</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Instructions:</strong> Drag players to reposition. Select assignments from dropdowns - routes auto-generate! Check the box next to a receiver to make them primary (red route). {isDrawingRoute ? '✏️ Custom drawing mode: Click to add points, double-click to finish route.' : 'Select "Draw Route (Custom)" to manually draw.'}
              </p>
            </div>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative">
              <svg
                ref={svgRef}
                width="700"
                height="400"
                className="w-full h-auto bg-green-100"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleFieldClick}
                onDoubleClick={handleFieldDoubleClick}
              >
                <rect width="700" height="400" fill="#2a6e3f" />
                
                {/* Field markings */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * 40}
                    x2="700"
                    y2={i * 40}
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}

                {/* Hash marks */}
                <line x1="250" y1="0" x2="250" y2="400" stroke="white" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                <line x1="450" y1="0" x2="450" y2="400" stroke="white" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                
                {/* Line of scrimmage */}
                <line x1="0" y1="200" x2="700" y2="200" stroke="white" strokeWidth="3" />

                {/* Draw arrows FIRST */}
                {players.map(player => renderBallCarrierArrow(player))}
                {players.map(player => renderBlockingArrow(player))}
                {routes.map(route => renderPassRoute(route))}

                {/* Current route being drawn */}
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
                      strokeWidth="2.5"
                      strokeDasharray="5,5"
                    />
                    {currentRoute.map((point, idx) => (
                      <circle
                        key={idx}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill="#FF6600"
                      />
                    ))}
                  </g>
                )}

                {/* Draw players ON TOP */}
                {players.map(player => (
                  <g key={player.id}>
                    {player.side === 'defense' ? (
                      <rect
                        x={player.x - 12}
                        y={player.y - 12}
                        width="24"
                        height="24"
                        fill="red"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-move hover:fill-red-400"
                        onMouseDown={() => handleMouseDown(player.id)}
                      />
                    ) : (
                      <circle
                        cx={player.x}
                        cy={player.y}
                        r="12"
                        fill="white"
                        stroke="black"
                        strokeWidth="2"
                        className="cursor-move hover:fill-blue-100"
                        onMouseDown={() => handleMouseDown(player.id)}
                      />
                    )}
                    <text
                      x={player.x}
                      y={player.y + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="black"
                      pointerEvents="none"
                    >
                      {player.label}
                    </text>
                  </g>
                ))}
              </svg>
              
              {isDrawingRoute && (
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border-2 border-orange-400">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    ✏️ Drawing Custom Route
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    Click: Add point • Double-click: Finish
                  </p>
                  <button
                    onClick={cancelCustomRoute}
                    className="w-full px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Cancel (Esc)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ========== END RIGHT COLUMN ========== */}

      </div>
      {/* END TWO-COLUMN GRID */}

      {/* Validation Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Formation Validation
                </h3>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary */}
              <div className={`mb-4 p-4 rounded-lg ${
                validationResult.isValid 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className="font-semibold text-gray-900">
                  {getValidationSummary(validationResult)}
                </p>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Critical Errors (Must Fix)
                  </h4>
                  <ul className="space-y-2">
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-700 bg-red-50 p-3 rounded">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-yellow-700 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Warnings (Review Recommended)
                  </h4>
                  <ul className="space-y-2">
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Educational Note */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Coach's Note:</strong> These validations ensure your plays follow official football rules. 
                  {validationResult.errors.length > 0 
                    ? ' Critical errors indicate this formation would likely draw a penalty in a real game. Review and adjust player positions, or save anyway if this is intentional for practice/demonstration purposes.'
                    : ' Warnings are suggestions - you can save if this is intentional for your scheme.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back & Fix
                </button>
                
                <button
                  onClick={handleSaveAnyway}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    validationResult.errors.length > 0
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {validationResult.errors.length > 0 ? 'Save Anyway (Override)' : 'Save Anyway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}