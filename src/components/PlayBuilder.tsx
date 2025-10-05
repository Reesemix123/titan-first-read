'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  OFFENSIVE_FORMATIONS, 
  DEFENSIVE_FORMATIONS, 
  SPECIAL_TEAMS_FORMATIONS 
} from '@/config/footballConfig';

interface PlayBuilderProps {
  teamId: string;
  teamName: string;
}

interface Player {
  id: string;
  position: string;
  x: number;
  y: number;
  label: string;
}

interface Route {
  id: string;
  playerId: string;
  path: { x: number; y: number }[];
  type: 'pass' | 'run' | 'block';
  routeType?: string;
}

export default function PlayBuilder({ teamId, teamName }: PlayBuilderProps) {
  const supabase = createClient();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // State
  const [playName, setPlayName] = useState('');
  const [odk, setOdk] = useState<'Offense' | 'Defense' | 'Special Teams'>('Offense');
  const [selectedFormation, setSelectedFormation] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fieldWidth = 600;
  const fieldHeight = 450;
  const losY = 260;

  // Load formation
  const loadFormation = useCallback((formationName: string) => {
    let formationData;
    
    if (odk === 'Offense') {
      formationData = OFFENSIVE_FORMATIONS[formationName];
    } else if (odk === 'Defense') {
      formationData = DEFENSIVE_FORMATIONS[formationName];
    } else {
      formationData = SPECIAL_TEAMS_FORMATIONS[formationName];
    }

    if (!formationData) return;

    const newPlayers: Player[] = formationData.map((p, index) => ({
      id: `player-${index}`,
      position: p.position,
      x: p.x,
      y: p.y,
      label: p.label
    }));

    setPlayers(newPlayers);
    setRoutes([]);
    setSelectedFormation(formationName);
  }, [odk]);

  // Generate pass route
  const generatePassRoute = (player: Player, routeType: string): { x: number; y: number }[] => {
    const path = [{ x: player.x, y: player.y }];
    
    switch (routeType) {
      case 'go':
        path.push({ x: player.x, y: losY - 150 });
        break;
      case 'slant':
        path.push({ x: player.x, y: losY - 50 });
        const slantDir = player.x < 300 ? 1 : -1;
        path.push({ x: player.x + (slantDir * 80), y: losY - 130 });
        break;
      case 'out':
        path.push({ x: player.x, y: losY - 80 });
        const outDir = player.x < 300 ? -1 : 1;
        path.push({ x: player.x + (outDir * 100), y: losY - 80 });
        break;
      case 'post':
        path.push({ x: player.x, y: losY - 80 });
        const postDir = player.x < 300 ? 1 : -1;
        path.push({ x: player.x + (postDir * 100), y: losY - 180 });
        break;
      case 'hitch':
        path.push({ x: player.x, y: losY - 60 });
        path.push({ x: player.x, y: losY - 40 });
        break;
      case 'curl':
        path.push({ x: player.x, y: losY - 100 });
        const curlDir = player.x < 300 ? -1 : 1;
        path.push({ x: player.x + (curlDir * 30), y: losY - 80 });
        break;
    }
    
    return path;
  };

  // Handle route selection
  const handleRouteChange = (playerId: string, routeType: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Remove existing route for this player
    const filteredRoutes = routes.filter(r => r.playerId !== playerId);

    if (routeType === 'none') {
      setRoutes(filteredRoutes);
      return;
    }

    // Generate new route
    const path = generatePassRoute(player, routeType);
    const newRoute: Route = {
      id: `route-${Date.now()}-${playerId}`,
      playerId,
      path,
      type: 'pass',
      routeType
    };

    setRoutes([...filteredRoutes, newRoute]);
  };

  // Handle player drag
  const handleMouseDown = (playerId: string) => {
    setSelectedPlayer(playerId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedPlayer) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(20, Math.min(fieldWidth - 20, e.clientX - rect.left));
    const y = Math.max(20, Math.min(fieldHeight - 20, e.clientY - rect.top));

    setPlayers(prev => prev.map(p => 
      p.id === selectedPlayer ? { ...p, x, y } : p
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedPlayer(null);
  };

  // Save play
  const savePlay = async () => {
    if (!playName.trim() || players.length === 0) {
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

      const playData = {
        players,
        routes,
        formation: selectedFormation,
        odk
      };

      const newPlay = {
        team_id: teamId === 'personal' ? null : teamId,
        play_name: playName.trim(),
        play_code: playCode,
        name: playName.trim(),
        code: playCode,
        page_number: 0,
        extraction_confidence: 'drawn',
        play_diagram: playData,
        odk: odk,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('playbook_plays')
        .insert([newPlay]);

      if (error) throw error;

      alert(`Play "${playName}" saved successfully as ${playCode}!`);
      
      // Clear
      setPlayName('');
      setPlayers([]);
      setRoutes([]);
      setSelectedFormation('');

    } catch (error) {
      console.error('Error saving play:', error);
      alert('Error saving play. Please try again.');
    }
  };

  // Get formation options
  const getFormationOptions = () => {
    if (odk === 'Offense') return Object.keys(OFFENSIVE_FORMATIONS);
    if (odk === 'Defense') return Object.keys(DEFENSIVE_FORMATIONS);
    return Object.keys(SPECIAL_TEAMS_FORMATIONS);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Play Builder - {teamName}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Play Name
            </label>
            <input
              type="text"
              value={playName}
              onChange={(e) => setPlayName(e.target.value)}
              placeholder="Enter play name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ODK
            </label>
            <select
              value={odk}
              onChange={(e) => {
                setOdk(e.target.value as 'Offense' | 'Defense' | 'Special Teams');
                setPlayers([]);
                setRoutes([]);
                setSelectedFormation('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="Offense">Offense</option>
              <option value="Defense">Defense</option>
              <option value="Special Teams">Special Teams</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formation
            </label>
            <select
              value={selectedFormation}
              onChange={(e) => loadFormation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="">Select Formation</option>
              {getFormationOptions().map(formation => (
                <option key={formation} value={formation}>
                  {formation}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={savePlay}
              disabled={!playName.trim() || players.length === 0}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Play
            </button>
          </div>
        </div>

        {/* Pass Routes - Only for Offense */}
        {odk === 'Offense' && players.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pass Routes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {players
                .filter(p => ['X', 'Z', 'Y', 'SL', 'TE', 'RB', 'FB'].includes(p.label))
                .map(player => {
                  const existingRoute = routes.find(r => r.playerId === player.id);
                  return (
                    <div key={player.id}>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        {player.label}
                      </label>
                      <select
                        value={existingRoute?.routeType || 'none'}
                        onChange={(e) => handleRouteChange(player.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="go">Go</option>
                        <option value="slant">Slant</option>
                        <option value="out">Out</option>
                        <option value="post">Post</option>
                        <option value="hitch">Hitch</option>
                        <option value="curl">Curl</option>
                      </select>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Field Canvas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <svg
          ref={svgRef}
          width={fieldWidth}
          height={fieldHeight}
          viewBox={`0 0 ${fieldWidth} ${fieldHeight}`}
          className="border border-gray-300 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Field Background */}
          <rect width={fieldWidth} height={fieldHeight} fill="#2a6e3f" />

          {/* Yard Lines */}
          {Array.from({ length: 9 }, (_, i) => {
            const y = 40 + i * 45;
            return (
              <line
                key={`yard-${i}`}
                x1={0}
                y1={y}
                x2={fieldWidth}
                y2={y}
                stroke="white"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Hash marks */}
          <line x1={fieldWidth * 0.31} y1={0} x2={fieldWidth * 0.31} y2={fieldHeight} stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1={fieldWidth * 0.69} y1={0} x2={fieldWidth * 0.69} y2={fieldHeight} stroke="white" strokeWidth="1" opacity="0.3" />

          {/* Line of Scrimmage */}
          <line x1={0} y1={losY} x2={fieldWidth} y2={losY} stroke="yellow" strokeWidth="3" />
          <text x={fieldWidth/2} y={losY - 10} fill="yellow" fontSize="12" fontWeight="bold" textAnchor="middle">
            Line of Scrimmage
          </text>

          {/* Field Labels */}
          <text x={fieldWidth/2} y={30} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7">
            DEFENSE
          </text>
          <text x={fieldWidth/2} y={430} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7">
            OFFENSE
          </text>

          {/* Players */}
          {players.map((player) => (
            <g key={player.id}>
              {odk === 'Defense' ? (
                <rect
                  x={player.x - 12}
                  y={player.y - 12}
                  width="24"
                  height="24"
                  fill="red"
                  stroke="black"
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

          {/* Routes */}
          {routes.map((route) => {
            const player = players.find(p => p.id === route.playerId);
            if (!player) return null;

            const updatedPath = [{ x: player.x, y: player.y }, ...route.path.slice(1)];
            const pathString = updatedPath.map((p, i) => 
              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ');

            const lastPoint = updatedPath[updatedPath.length - 1];
            const secondLastPoint = updatedPath[updatedPath.length - 2];
            const angle = Math.atan2(
              lastPoint.y - secondLastPoint.y,
              lastPoint.x - secondLastPoint.x
            ) * 180 / Math.PI;

            return (
              <g key={route.id}>
                <path
                  d={pathString}
                  fill="none"
                  stroke="#0066CC"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon
                  points="-8,-4 0,0 -8,4 -6,0"
                  fill="#0066CC"
                  transform={`translate(${lastPoint.x},${lastPoint.y}) rotate(${angle})`}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}