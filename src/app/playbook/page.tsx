'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import PlayBuilder from '@/components/PlayBuilder';

interface Team {
  id: string;
  name: string;
  level: string;
}

interface Play {
  id: string;
  play_code: string;
  play_name: string;
  attributes: {
    odk: 'offense' | 'defense' | 'specialTeams';
    formation: string;
    playType?: string;
    coverage?: string;
    blitzType?: string;
    unit?: string;
    targetHole?: string;
    ballCarrier?: string;
    customTags?: string[];
  };
  diagram: any;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export default function PlaybookPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [plays, setPlays] = useState<Play[]>([]);
  const [filteredPlays, setFilteredPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [editingPlay, setEditingPlay] = useState<Play | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterODK, setFilterODK] = useState<string>('all');
  const [filterFormation, setFilterFormation] = useState<string>('all');
  
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          return;
        }
        
        setUser(user);
        if (user) {
          await fetchTeams();
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlays();
    } else {
      setPlays([]);
      setFilteredPlays([]);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    applyFilters();
  }, [plays, searchTerm, filterODK, filterFormation]);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, level')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }

  async function fetchPlays() {
    try {
      const { data, error } = await supabase
        .from('playbook_plays')
        .select('*')
        .eq('team_id', selectedTeamId === 'personal' ? null : selectedTeamId)
        .eq('is_archived', false)
        .order('play_code', { ascending: true });

      if (error) {
        console.error('Error fetching plays:', error);
      } else {
        setPlays(data || []);
      }
    } catch (error) {
      console.error('Error fetching plays:', error);
    }
  }

  function applyFilters() {
    let filtered = [...plays];

    if (searchTerm) {
      filtered = filtered.filter(play => 
        play.play_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        play.play_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterODK !== 'all') {
      filtered = filtered.filter(play => play.attributes?.odk === filterODK);
    }

    if (filterFormation !== 'all') {
      filtered = filtered.filter(play => play.attributes?.formation === filterFormation);
    }

    setFilteredPlays(filtered);
  }

  async function handleDeletePlay(playId: string) {
    if (!confirm('Are you sure you want to delete this play?')) return;

    try {
      const { error } = await supabase
        .from('playbook_plays')
        .delete()
        .eq('id', playId);

      if (error) throw error;

      await fetchPlays();
    } catch (error) {
      console.error('Error deleting play:', error);
      alert('Error deleting play');
    }
  }

  async function handleArchivePlay(playId: string) {
    try {
      const { error } = await supabase
        .from('playbook_plays')
        .update({ is_archived: true })
        .eq('id', playId);

      if (error) throw error;

      await fetchPlays();
    } catch (error) {
      console.error('Error archiving play:', error);
      alert('Error archiving play');
    }
  }

  function handleEditPlay(play: Play) {
    setEditingPlay(play);
    setView('builder');
  }

  function handleNewPlay() {
    setEditingPlay(null);
    setView('builder');
  }

  function handleBackToList() {
    setView('list');
    setEditingPlay(null);
    fetchPlays();
  }

  const uniqueFormations = Array.from(
    new Set(plays.map(p => p.attributes?.formation).filter(Boolean))
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the playbook.</p>
          <a 
            href="/auth/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {view === 'list' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Playbook Manager</h1>
              <p className="text-xl text-gray-600">View, edit, and organize your plays</p>
            </div>

            {/* Team Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Select Team</h2>
                  <p className="text-sm text-gray-600">Choose a team to view its playbook</p>
                </div>
                <div className="w-64">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                  >
                    <option value="">Select a team...</option>
                    <option value="personal">Personal Playbook</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedTeamId && (
              <>
                {/* Filters and Actions */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search plays..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ODK</label>
                      <select
                        value={filterODK}
                        onChange={(e) => setFilterODK(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                      >
                        <option value="all">All</option>
                        <option value="offense">Offense</option>
                        <option value="defense">Defense</option>
                        <option value="specialTeams">Special Teams</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Formation</label>
                      <select
                        value={filterFormation}
                        onChange={(e) => setFilterFormation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
                      >
                        <option value="all">All Formations</option>
                        {uniqueFormations.map(formation => (
                          <option key={formation} value={formation}>
                            {formation}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleNewPlay}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Create New Play
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Showing {filteredPlays.length} of {plays.length} plays</span>
                    {(searchTerm || filterODK !== 'all' || filterFormation !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterODK('all');
                          setFilterFormation('all');
                        }}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Plays Grid */}
                {filteredPlays.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <p className="text-gray-600 text-lg mb-4">
                      {plays.length === 0 
                        ? 'No plays yet. Create your first play!'
                        : 'No plays match your filters.'
                      }
                    </p>
                    {plays.length === 0 && (
                      <button
                        onClick={handleNewPlay}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Create First Play
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlays.map(play => (
                      <div key={play.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{play.play_code}</h3>
                              <p className="text-sm text-gray-600">{play.play_name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              play.attributes?.odk === 'offense' ? 'bg-blue-100 text-blue-800' :
                              play.attributes?.odk === 'defense' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {play.attributes?.odk === 'offense' ? 'OFF' :
                               play.attributes?.odk === 'defense' ? 'DEF' : 'ST'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Formation:</span> {play.attributes?.formation || 'N/A'}</p>
                            {play.attributes?.playType && (
                              <p><span className="font-medium">Type:</span> {play.attributes.playType}</p>
                            )}
                            {play.attributes?.coverage && (
                              <p><span className="font-medium">Coverage:</span> {play.attributes.coverage}</p>
                            )}
                            {play.attributes?.unit && (
                              <p><span className="font-medium">Unit:</span> {play.attributes.unit}</p>
                            )}
                          </div>

                          {play.comments && (
                            <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">{play.comments}</p>
                          )}
                        </div>

                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                          <button
                            onClick={() => handleEditPlay(play)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                          >
                            Edit
                          </button>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleArchivePlay(play.id)}
                              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleDeletePlay(play.id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Back to Playbook
              </button>
            </div>
            
            <PlayBuilder 
              teamId={selectedTeamId || 'personal'} 
              teamName={selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name || 'Unknown Team' : 'Personal Playbook'}
            />
          </>
        )}

        {/* User Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Signed in as: <span className="font-medium">{user.email}</span>
        </div>
      </div>
    </div>
  );
}