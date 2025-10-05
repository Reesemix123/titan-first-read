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

export default function PlaybookPage() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
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
  }, [supabase]);

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Visual Playbook Builder</h1>
          <p className="text-xl text-gray-600">Draw plays, set formations, and create your playbook</p>
        </div>

        {/* Team Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Context</h2>
              <p className="text-sm text-gray-600">Choose a team to save plays to, or leave blank for personal playbook</p>
            </div>
            <div className="w-64">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
              >
                <option value="">Personal Playbook</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PlayBuilder Component */}
        <PlayBuilder 
          teamId={selectedTeamId || 'personal'} 
          teamName={selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name || 'Unknown Team' : 'Personal Playbook'}
        />

        {/* User Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Signed in as: <span className="font-medium">{user.email}</span>
        </div>
      </div>
    </div>
  );
}