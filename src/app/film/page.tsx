'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";

interface Game {
  id: string;
  name: string;
  opponent?: string;
  date?: string;
  team_id?: string;
}

interface GameForm {
  date: string;
  label: string;
  teamRole: "ours" | "opponent";
  video?: FileList;
}

interface Video {
  id: string;
  name: string;
  url?: string;
  game_id?: string;
}

export default function FilmPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GameForm>();

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchVideos(selectedGame.id);
    }
  }, [selectedGame]);

  async function fetchGames() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }

  async function fetchVideos(gameId: string) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  async function onSubmit(values: GameForm) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to create a game');
        return;
      }

      setIsUploading(true);
      setUploadStatus('Creating game...');

      // Create game record
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([
          {
            date: values.date,
            name: values.label,
            opponent: values.teamRole === 'opponent' ? values.label : undefined,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (gameError) throw gameError;

      setUploadStatus('Game created successfully!');

      // Handle video upload if provided
      if (values.video && values.video.length > 0) {
        const videoFile = values.video[0];
        setUploadStatus('Uploading video...');

        // Upload video to Supabase Storage
        const fileName = `${gameData.id}/${Date.now()}_${videoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('game_videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        // Create video record
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .insert([
            {
              name: videoFile.name,
              file_path: fileName,
              game_id: gameData.id
            }
          ])
          .select()
          .single();

        if (videoError) throw videoError;

        setVideos(prev => [videoData, ...prev]);
        setUploadStatus('Video uploaded successfully!');
      }

      setGames(prev => [gameData, ...prev]);
      setSelectedGame(gameData);
      reset();

      setTimeout(() => {
        setUploadStatus('');
      }, 3000);

    } catch (error) {
      console.error('Error creating game:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        setUploadStatus('');
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Film Analysis</h1>
          <p className="text-xl text-gray-600">Upload and analyze game footage</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Game Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Game</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Date</label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Label</label>
                <input
                  {...register('label', { required: 'Label is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., vs Eagles, Practice Session"
                />
                {errors.label && (
                  <p className="text-red-600 text-sm mt-1">{errors.label.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Role</label>
                <select
                  {...register('teamRole', { required: 'Please select team role' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="ours">Our Team</option>
                  <option value="opponent">Opponent</option>
                </select>
                {errors.teamRole && (
                  <p className="text-red-600 text-sm mt-1">{errors.teamRole.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Video (Optional)</label>
                <input
                  {...register('video')}
                  type="file"
                  accept="video/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Creating...' : 'Create Game'}
              </button>

              {uploadStatus && (
                <div className={`text-sm p-3 rounded-md ${
                  uploadStatus.includes('Error') || uploadStatus.includes('Failed')
                    ? 'text-red-700 bg-red-50'
                    : 'text-green-700 bg-green-50'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </form>
          </div>

          {/* Games List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Games</h2>
            
            <div className="space-y-3">
              {games.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No games created yet. Add your first game to get started!</p>
              ) : (
                games.map(game => (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGame?.id === game.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{game.name}</h3>
                        <p className="text-sm text-gray-600">
                          {game.date ? new Date(game.date).toLocaleDateString() : 'No date'}
                        </p>
                        {game.opponent && (
                          <p className="text-sm text-gray-600">vs {game.opponent}</p>
                        )}
                      </div>
                      {selectedGame?.id === game.id && (
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

            {/* Selected Game Videos */}
            {selectedGame && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Videos for {selectedGame.name} ({videos.length})
                </h3>
                <div className="space-y-2">
                  {videos.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No videos uploaded for this game yet.</p>
                  ) : (
                    videos.map(video => (
                      <div key={video.id} className="p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-gray-900">{video.name}</h4>
                        <p className="text-sm text-gray-600">Video uploaded successfully</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}