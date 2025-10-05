'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import PlaybookUpload from '@/components/PlaybookUpload';
import PlaybookViewer from '@/components/PlaybookViewer';

interface Team {
  id: string;
  name: string;
  level: string;
  colors: any;
  created_at: string;
}

export default function SetupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamLevel, setTeamLevel] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'teams' | 'playbook'>('teams');
  
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setMessage('Authentication error. Please sign in.');
          return;
        }
        
        setUser(user);
        if (user) {
          await fetchTeams();
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setMessage('Unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [supabase]);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(data || []);
        if (data && data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }

  async function createTeam() {
    if (!user) {
      setMessage('Please sign in to create a team');
      return;
    }

    if (!teamName.trim()) {
      setMessage('Please enter a team name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ 
          name: teamName.trim(), 
          level: teamLevel.trim() || 'High School',
          colors: { primary: 'Blue', secondary: 'White' },
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`Success! Created team: ${data.name}`);
        setTeamName('');
        setTeamLevel('');
        await fetchTeams(); // Refresh teams list
        setSelectedTeamId(data.id); // Select the newly created team
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

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
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
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
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Team Management</h1>
          <p className="text-xl text-gray-600">Create teams, upload playbooks, and manage your plays</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'teams'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teams & Upload
            </button>
            <button
              onClick={() => setActiveTab('playbook')}
              disabled={!selectedTeamId}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'playbook' && selectedTeamId
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
              }`}
            >
              Playbook Manager
              {selectedTeamId && teams.find(t => t.id === selectedTeamId) && (
                <span className="ml-2 text-xs">({teams.find(t => t.id === selectedTeamId)?.name})</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'teams' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Team Section */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Team</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                      Team Name *
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="teamLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      Team Level
                    </label>
                    <input
                      id="teamLevel"
                      type="text"
                      value={teamLevel}
                      onChange={(e) => setTeamLevel(e.target.value)}
                      placeholder="e.g., High School, College, Youth"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave blank to default to "High School"</p>
                  </div>
                  
                  <button
                    onClick={createTeam}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    Create Team
                  </button>
                  
                  {message && (
                    <div className={`p-4 rounded-lg border ${
                      message.includes('Success') 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>

              {/* Teams List Section */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Teams</h2>
                
                {teams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v8a1 1 0 01-1 1H9a1 1 0 01-1-1v-8h5m8-8v8m0-8c0-1.105-.895-2-2-2H10c-1.105 0-2 .895-2 2m8 0V8a2 2 0 00-2-2H8a2 2 0 00-2 2v4m8 0V8m0 4H8m0 0v8h8v-8H8z" />
                    </svg>
                    <p>No teams created yet</p>
                    <p className="text-sm">Create your first team to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTeamId === team.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{team.name}</h3>
                            <p className="text-sm text-gray-600">{team.level}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedTeamId === team.id && (
                              <div className="text-indigo-600">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTeamId(team.id);
                                setActiveTab('playbook');
                              }}
                              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              View Playbook
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation to Film Page */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <a
                    href="/film"
                    className="w-full flex items-center justify-center px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Manage Game Film
                  </a>
                </div>
              </div>
            </div>

            {/* PDF Upload Section */}
            {selectedTeamId && (
              <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Upload Playbook for {teams.find(t => t.id === selectedTeamId)?.name}
                </h2>
                <PlaybookUpload 
                  teamId={selectedTeamId}
                  onPlaysExtracted={(plays) => {
                    console.log('Plays extracted:', plays);
                  }}
                  onUploadComplete={() => {
                    console.log('Upload complete!');
                    // Switch to playbook tab after upload
                    setActiveTab('playbook');
                  }}
                />
              </div>
            )}
          </>
        ) : (
          /* Playbook Manager Tab */
          selectedTeamId && (
            <PlaybookViewer 
              teamId={selectedTeamId}
              teamName={teams.find(t => t.id === selectedTeamId)?.name || 'Unknown Team'}
            />
          )
        )}

        {/* User Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Signed in as: <span className="font-medium">{user.email}</span>
        </div>
      </div>
    </div>
  );
}