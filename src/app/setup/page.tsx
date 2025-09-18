'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';

interface Team {
  id: string;
  name: string;
  created_at?: string;
  color?: string;
}

interface Play {
  id: string;
  name: string;
  formation?: string;
  team_id?: string;
}

interface Playbook {
  id: string;
  name: string;
  file_path?: string;
  team_id?: string;
}

interface TeamFormData {
  name: string;
  color: string;
}

interface PlayFormData {
  name: string;
  formation?: string;
}

export default function SetupPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [plays, setPlays] = useState<Play[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isAddingPlay, setIsAddingPlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const teamForm = useForm<TeamFormData>();
  const playForm = useForm<PlayFormData>();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchPlays(selectedTeam.id);
      fetchPlaybooks(selectedTeam.id);
    }
  }, [selectedTeam]);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }

  async function fetchPlays(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('plays')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlays(data || []);
    } catch (error) {
      console.error('Error fetching plays:', error);
    }
  }

  async function fetchPlaybooks(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaybooks(data || []);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
    }
  }

  function selectTeam(team: Team) {
    setSelectedTeam(team);
  }

  async function onCreateTeam(values: TeamFormData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to create a team');
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .insert([
          {
            name: values.name,
            color: values.color,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => [data, ...prev]);
      setSelectedTeam(data);
      setIsCreatingTeam(false);
      teamForm.reset();
      console.log('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  }

  async function onAddPlay(values: PlayFormData) {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('plays')
        .insert([
          {
            name: values.name,
            formation: values.formation || 'Unknown',
            team_id: selectedTeam.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPlays(prev => [data, ...prev]);
      setIsAddingPlay(false);
      playForm.reset();
      console.log('Play added successfully');
    } catch (error) {
      console.error('Error adding play:', error);
      alert('Failed to add play');
    }
  }

  async function handlePlaybookUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedTeam) {
      alert('Please select a team and file');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading file...');

    try {
      // Upload file to Supabase Storage
      const fileName = `${selectedTeam.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('playbook_pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      console.log('File uploaded successfully:', fileName);
      setUploadStatus('Processing PDF...');

      // Extract PDF content
      const { extractPDFText } = await import('@/lib/pdfExtraction');
      const extractedText = await extractPDFText(file);

      if (!extractedText.trim()) {
        throw new Error('No text content found in PDF');
      }

      console.log('PDF text extracted successfully');
      setUploadStatus('Saving playbook...');

      // Save playbook record
      const { data: playbookData, error: playbookError } = await supabase
        .from('playbooks')
        .insert([
          {
            name: file.name,
            file_path: fileName,
            team_id: selectedTeam.id,
            content: extractedText
          }
        ])
        .select()
        .single();

      if (playbookError) throw playbookError;

      setPlaybooks(prev => [playbookData, ...prev]);
      setUploadStatus('Playbook uploaded successfully!');

      // Auto-extract plays from the PDF text
      const { extractPlaysFromText } = await import('@/lib/pdfExtraction');
      const extractedPlays = extractPlaysFromText(extractedText);

      if (extractedPlays.length > 0) {
        setUploadStatus(`Found ${extractedPlays.length} potential plays. Adding to team...`);

        // Add extracted plays to the database
        const { data: newPlays, error: playsError } = await supabase
          .from('plays')
          .insert(
            extractedPlays.slice(0, 20).map(play => ({
              name: play.name,
              formation: play.formation || 'From PDF',
              team_id: selectedTeam.id,
              description: play.description
            }))
          )
          .select();

        if (playsError) {
          console.warn('Error adding extracted plays:', playsError);
        } else {
          setPlays(prev => [...(newPlays || []), ...prev]);
          setUploadStatus(`Successfully added ${newPlays?.length || 0} plays from PDF!`);
        }
      }

      setTimeout(() => {
        setUploadStatus('');
      }, 3000);

    } catch (error) {
      console.error('Error processing playbook:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        setUploadStatus('');
      }, 5000);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  const TEAM_COLORS = [
    "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Black", "White", 
    "Navy", "Maroon", "Gold", "Silver", "Gray", "Pink", "Brown", "Teal"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Team Setup & Management</h1>
          <p className="text-xl text-gray-600">Create teams, upload playbooks, and manage your football strategies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teams Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
              <button
                onClick={() => setIsCreatingTeam(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Team
              </button>
            </div>

            {isCreatingTeam && (
              <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                    <input
                      {...teamForm.register('name', { required: 'Team name is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter team name"
                    />
                    {teamForm.formState.errors.name && (
                      <p className="text-red-600 text-sm mt-1">{teamForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Color</label>
                    <select
                      {...teamForm.register('color', { required: 'Please select a color' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a color</option>
                      {TEAM_COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                    {teamForm.formState.errors.color && (
                      <p className="text-red-600 text-sm mt-1">{teamForm.formState.errors.color.message}</p>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Create Team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTeam(false);
                        teamForm.reset();
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {teams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No teams created yet. Create your first team to get started!</p>
              ) : (
                teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => selectTeam(team)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600">Color: {team.color || 'Not set'}</p>
                      </div>
                      {selectedTeam?.id === team.id && (
                        <div className="text-blue-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Management Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedTeam ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Managing: <span className="text-blue-600">{selectedTeam.name}</span>
                </h2>

                {/* Playbook Upload */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Playbook</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PDF Playbook
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePlaybookUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                      />
                    </div>

                    {isUploading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}

                    {uploadStatus && (
                      <div className={`text-sm p-3 rounded-md ${
                        uploadStatus.includes('Error') || uploadStatus.includes('Failed')
                          ? 'text-red-700 bg-red-50'
                          : 'text-green-700 bg-green-50'
                      }`}>
                        {uploadStatus}
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Play Addition */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Plays ({plays.length})</h3>
                    <button
                      onClick={() => setIsAddingPlay(true)}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Play
                    </button>
                  </div>

                  {isAddingPlay && (
                    <form onSubmit={playForm.handleSubmit(onAddPlay)} className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Play Name</label>
                          <input
                            {...playForm.register('name', { required: 'Play name is required' })}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter play name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Formation (Optional)</label>
                          <input
                            {...playForm.register('formation')}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., I-Formation, Shotgun, etc."
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            Add Play
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingPlay(false);
                              playForm.reset();
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {plays.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No plays added yet. Upload a playbook or add plays manually!</p>
                    ) : (
                      plays.map(play => (
                        <div key={play.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{play.name}</h4>
                              <p className="text-sm text-gray-600">Formation: {play.formation || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Playbooks List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Playbooks ({playbooks.length})</h3>
                  <div className="space-y-2">
                    {playbooks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No playbooks uploaded yet.</p>
                    ) : (
                      playbooks.map(playbook => (
                        <div key={playbook.id} className="p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900">{playbook.name}</h4>
                          <p className="text-sm text-gray-600">Uploaded successfully</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team</h3>
                <p className="text-gray-600">Choose a team from the left panel to manage plays and upload playbooks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}