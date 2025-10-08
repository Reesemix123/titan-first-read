'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from '@/components/AuthGuard';
import { useForm } from "react-hook-form";
import { createClient } from '@/utils/supabase/client';

interface Team {
  id: string;
  name: string;
  level: string;
}

interface Game {
  id: string;
  name: string;
  opponent?: string;
  date?: string;
  team_id?: string;
  video_count?: number;
  play_count?: number;
}

interface GameForm {
  date: string;
  opponent: string;
  video?: FileList;
}

export default function FilmPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [games, setGames] = useState<Game[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GameForm>();

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchGames();
    } else {
      setGames([]);
    }
  }, [selectedTeam]);

  async function fetchTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, level')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
  }

  async function fetchGames() {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        videos(count),
        play_instances:play_instances(count)
      `)
      .eq('team_id', selectedTeam)
      .order('date', { ascending: false });

    if (!error && data) {
      const gamesWithCounts = data.map(game => ({
        ...game,
        video_count: game.videos?.[0]?.count || 0,
        play_count: game.play_instances?.[0]?.count || 0
      }));
      setGames(gamesWithCounts);
    }
  }

  async function onSubmit(values: GameForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to create a game');
      return;
    }

    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Creating game...');

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert([{
        date: values.date,
        name: `vs ${values.opponent}`,
        opponent: values.opponent,
        team_id: selectedTeam,
        user_id: user.id
      }])
      .select()
      .single();

    if (gameError) {
      setUploadStatus('Error: ' + gameError.message);
      setIsUploading(false);
      return;
    }

    if (values.video && values.video.length > 0) {
      const videoFile = values.video[0];
      setUploadStatus('Uploading video...');

      const fileName = `${gameData.id}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('game_videos')
        .upload(fileName, videoFile);

      if (uploadError) {
        setUploadStatus('Error uploading video: ' + uploadError.message);
        setIsUploading(false);
        return;
      }

      await supabase
        .from('videos')
        .insert([{
          name: videoFile.name,
          file_path: fileName,
          game_id: gameData.id
        }]);

      setUploadStatus('Game and video created successfully!');
    } else {
      setUploadStatus('Game created successfully!');
    }

    reset();
    setIsUploading(false);
    fetchGames();

    setTimeout(() => {
      setUploadStatus('');
      router.push(`/film/${gameData.id}`);
    }, 1500);
  }

  async function deleteGame(gameId: string) {
    if (!confirm('Delete this game and all its videos/play tags?')) return;

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);

    if (!error) {
      fetchGames();
    } else {
      alert('Error deleting game: ' + error.message);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Film Room</h1>
            <p className="text-xl text-gray-600">Manage game film and analyze plays</p>
          </div>

          {/* Team Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.level})
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Game Form */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Game</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      {...register('date', { required: 'Date is required' })}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
                    <input
                      {...register('opponent', { required: 'Opponent is required' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Eagles"
                    />
                    {errors.opponent && <p className="text-red-600 text-sm mt-1">{errors.opponent.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video (Optional)</label>
                    <input
                      {...register('video')}
                      type="file"
                      accept="video/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 150MB</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Creating...' : 'Create Game'}
                  </button>

                  {uploadStatus && (
                    <div className={uploadStatus.includes('Error') ? 'text-red-700 bg-red-50 p-3 rounded text-sm' : 'text-green-700 bg-green-50 p-3 rounded text-sm'}>
                      {uploadStatus}
                    </div>
                  )}
                </form>
              </div>

              {/* Games Grid */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Games ({games.length})</h2>
                
                {games.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <p className="text-gray-500 text-lg">No games yet. Create your first game!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {games.map(game => (
                      <div
                        key={game.id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => router.push(`/film/${game.id}`)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{game.name}</h3>
                              <p className="text-sm text-gray-600">
                                {game.date ? new Date(game.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'No date'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>{game.video_count || 0} video{game.video_count === 1 ? '' : 's'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{game.play_count || 0} play{game.play_count === 1 ? '' : 's'} tagged</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/film/${game.id}`);
                              }}
                              className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                            >
                              Open Film Room
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGame(game.id);
                              }}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}