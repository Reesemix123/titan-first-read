'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

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
  
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('teams').select('*');
        setTeams(data || []);
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  async function createTeam() {
    if (!teamName.trim()) {
      setMessage('Please enter a team name');
      return;
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([{ 
        name: teamName.trim(), 
        level: teamLevel.trim() || 'High School',
        colors: { primary: 'Blue', secondary: 'White' },
        user_id: user?.id 
      }])
      .select()
      .single();

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Success! Created team: ' + data.name);
      setTeamName('');
      setTeamLevel('');
      const { data: updatedTeams } = await supabase.from('teams').select('*');
      setTeams(updatedTeams || []);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <a href="/auth/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Team Management</h1>

      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
        
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        
        <input
          type="text"
          value={teamLevel}
          onChange={(e) => setTeamLevel(e.target.value)}
          placeholder="Team Level"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        
        <button
          onClick={createTeam}
          className="w-full bg-indigo-600 text-white px-6 py-3 rounded"
        >
          Create Team
        </button>
        
        {message && <div className="mt-4 p-4 bg-gray-100 rounded">{message}</div>}

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Your Teams</h3>
          {teams.map((team) => (
            <div key={team.id} className="p-4 border rounded mb-2">
              <h4 className="font-bold">{team.name}</h4>
              <p className="text-sm text-gray-600">{team.level}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <a href="/playbook" className="block text-center px-6 py-3 bg-indigo-600 text-white rounded">
            Go to Playbook
          </a>
          <a href="/film" className="block text-center px-6 py-3 border border-indigo-600 text-indigo-600 rounded">
            Go to Film
          </a>
        </div>
      </div>
    </div>
  );
}