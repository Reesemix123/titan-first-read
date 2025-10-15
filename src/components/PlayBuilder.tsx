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
  getAttributeOptions,
  getAssignmentOptions,
  POSITION_GROUPS
} from '@/config/footballConfig';

interface Player {
  id: string;
  x: number;
  y: number;
  label: string;
  position: string;
  side: 'offense' | 'defense';
}

interface Route {
  id: string;
  playerId: string;
  points: Array<{ x: number; y: number }>;
  assignment?: string;
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
  const [personnel, setPersonnel] = useState(existingPlay?.attributes.personnel || '');
  const [coverage, setCoverage] = useState(existingPlay?.attributes.coverage || '');
  const [blitzType, setBlitzType] = useState(existingPlay?.attributes.blitzType || '');
  const [runConcept, setRunConcept] = useState(existingPlay?.attributes.runConcept || '');
  const [passConcept, setPassConcept] = useState(existingPlay?.attributes.passConcept || '');
  const [front, setFront] = useState(existingPlay?.attributes.front || '');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Array<{ x: number; y: number }>>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  
  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<Array<{ x: number; y: number }>>([]);
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        side: existingPlay.diagram.odk === 'defense' ? 'defense' : 'offense'
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
      const newPlayers: Player[] = formationData.map((pos, idx) => ({
        id: `${odk}-${idx}`,
        x: pos.x,
        y: pos.y,
        label: pos.label,
        position: pos.position,
        side: odk === 'defense' ? 'defense' : 'offense'
      }));
      
      setPlayers(newPlayers);
      setRoutes([]);
    }
  };

  const handleMouseDown = (playerId: string) => {
    setDraggedPlayer(playerId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedPlayer) {
      setPlayers(prev =>
        prev.map(p =>
          p.id === draggedPlayer ? { ...p, x, y } : p
        )
      );
    }

    if (isDrawingRoute && currentRoute.length > 0) {
      setCurrentRoute(prev => [...prev.slice(0, -1), { x, y }]);
    }
  }, [draggedPlayer, isDrawingRoute, currentRoute]);

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

  const startRoute = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setSelectedPlayer(playerId);
    setIsDrawingRoute(true);
    setCurrentRoute([{ x: player.x, y: player.y }]);
  };

  const finishRoute = () => {
    if (currentRoute.length > 1 && selectedPlayer) {
      setPendingRoute([...currentRoute]);
      setPendingPlayerId(selectedPlayer);
      setShowAssignmentModal(true);
    } else {
      cancelRoute();
    }
  };

  const cancelRoute = () => {
    setIsDrawingRoute(false);
    setCurrentRoute([]);
    setSelectedPlayer(null);
  };

  const saveRouteWithAssignment = () => {
    if (!selectedAssignment || !pendingPlayerId) return;

    setRoutes(prev => [
      ...prev,
      {
        id: `route-${Date.now()}`,
        playerId: pendingPlayerId,
        points: [...pendingRoute],
        assignment: selectedAssignment
      }
    ]);

    setShowAssignmentModal(false);
    setPendingRoute([]);
    setPendingPlayerId(null);
    setSelectedAssignment('');
    setIsDrawingRoute(false);
    setCurrentRoute([]);
    setSelectedPlayer(null);
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  const getPositionGroup = (position: string): string => {
    if (POSITION_GROUPS.linemen.includes(position)) return 'Offensive Line';
    if (POSITION_GROUPS.backs.includes(position)) return 'Backs';
    if (POSITION_GROUPS.receivers.includes(position) || 
        position.includes('WR') || 
        position.includes('TE') ||
        ['X', 'Y', 'Z', 'SL', 'SR', 'SE', 'FL'].includes(position)) {
      return 'Receivers';
    }
    return 'Other';
  };

  const getAvailableAssignments = (): string[] => {
    if (!pendingPlayerId) return [];
    
    const player = players.find(p => p.id === pendingPlayerId);
    if (!player) return [];

    const playTypeForAssignment = playType === 'Run' ? 'run' : 'pass';
    return getAssignmentOptions(player.position, playTypeForAssignment);
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

    setIsSaving(true);

    const diagram: PlayDiagram = {
      players: players.map(p => ({
        position: p.position,
        x: p.x,
        y: p.y,
        label: p.label
      })),
      routes: routes.map(r => ({
        id: r.id,
        playerId: r.playerId,
        path: r.points,
        type: playType === 'Pass' ? 'pass' : 'run',
        routeType: r.assignment
      })),
      formation,
      odk
    };

    const attributes: PlayAttributes = {
      odk,
      formation,
      playType: playType || undefined,
      personnel: personnel || undefined,
      runConcept: runConcept || undefined,
      passConcept: passConcept || undefined,
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

  const availableFormations = formationList();
  const currentPlayer = pendingPlayerId ? players.find(p => p.id === pendingPlayerId) : null;
  const positionGroup = currentPlayer ? getPositionGroup(currentPlayer.position) : '';
  const availableAssignments = getAvailableAssignments();

  return (
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

        <div className="grid grid-cols-2 gap-4 mb-4">
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
        </div>

        {odk === 'offense' && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Play Type
              </label>
              <select
                value={playType}
                onChange={(e) => setPlayType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Select...</option>
                {OFFENSIVE_ATTRIBUTES.playType.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Personnel
              </label>
              <select
                value={personnel}
                onChange={(e) => setPersonnel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Select...</option>
                {OFFENSIVE_ATTRIBUTES.personnel.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            {playType === 'Run' && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Run Concept
                </label>
                <select
                  value={runConcept}
                  onChange={(e) => setRunConcept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">Select...</option>
                  {OFFENSIVE_ATTRIBUTES.runConcepts.map(rc => (
                    <option key={rc} value={rc}>{rc}</option>
                  ))}
                </select>
              </div>
            )}
            
            {playType === 'Pass' && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Pass Concept
                </label>
                <select
                  value={passConcept}
                  onChange={(e) => setPassConcept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">Select...</option>
                  {OFFENSIVE_ATTRIBUTES.passConcepts.map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

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

      {/* Drawing Canvas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Play Diagram</h3>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>Instructions:</strong> Select a formation to load players. 
            Drag players to reposition. Click a player to start drawing their assignment, 
            click on the field to add points, then click "Finish Route".
          </p>
        </div>

        {players.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => startRoute(player.id)}
                disabled={isDrawingRoute}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {player.label}
              </button>
            ))}
          </div>
        )}

        <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative">
          <svg
            ref={svgRef}
            width="700"
            height="400"
            className="bg-green-100"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleFieldClick}
          >
            <rect width="700" height="400" fill="#2a6e3f" />
            
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

            <line x1="250" y1="0" x2="250" y2="400" stroke="white" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
            <line x1="450" y1="0" x2="450" y2="400" stroke="white" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
            <line x1="0" y1="200" x2="700" y2="200" stroke="white" strokeWidth="3" />

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

            {routes.map((route) => {
              const player = players.find(p => p.id === route.playerId);
              if (!player) return null;

              return (
                <g key={route.id}>
                  <path
                    d={(() => {
                      let path = `M ${player.x} ${player.y}`;
                      for (let i = 1; i < route.points.length; i++) {
                        path += ` L ${route.points[i].x} ${route.points[i].y}`;
                      }
                      return path;
                    })()}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  {route.points.length > 1 && (
                    <>
                      {(() => {
                        const lastPoint = route.points[route.points.length - 1];
                        const secondLast = route.points[route.points.length - 2];
                        const angle = Math.atan2(
                          lastPoint.y - secondLast.y,
                          lastPoint.x - secondLast.x
                        ) * 180 / Math.PI;
                        
                        return (
                          <polygon
                            points="-10,-5 0,0 -10,5 -8,0"
                            fill="#FFD700"
                            transform={`translate(${lastPoint.x},${lastPoint.y}) rotate(${angle})`}
                          />
                        );
                      })()}
                      {route.assignment && (
                        <text
                          x={route.points[route.points.length - 1].x + 12}
                          y={route.points[route.points.length - 1].y - 8}
                          fontSize="10"
                          fill="white"
                          fontWeight="bold"
                          stroke="black"
                          strokeWidth="0.5"
                        >
                          {route.assignment}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            })}
            
            {currentRoute.length > 1 && (
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
            )}
          </svg>
          
          {isDrawingRoute && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <button
                onClick={finishRoute}
                className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 mr-2 transition-colors"
              >
                Finish Route
              </button>
              <button
                onClick={cancelRoute}
                className="px-4 py-2 bg-gray-500 text-white rounded font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {routes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Assignments:</h4>
            <div className="space-y-2">
              {routes.map(route => {
                const player = players.find(p => p.id === route.playerId);
                return (
                  <div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">
                      {player?.label}: {route.assignment || 'No assignment'}
                    </span>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Assign Route for {currentPlayer?.label}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Position Group: <strong>{positionGroup}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Assignment *
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                autoFocus
              >
                <option value="">Select assignment...</option>
                {availableAssignments.map(assignment => (
                  <option key={assignment} value={assignment}>
                    {assignment}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setPendingRoute([]);
                  setPendingPlayerId(null);
                  setSelectedAssignment('');
                  cancelRoute();
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-semibold text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRouteWithAssignment}
                disabled={!selectedAssignment}
                className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
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
  );
}