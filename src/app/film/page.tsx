'use client';

import { useEffect, useState } from "react";
import AuthGuard from '@/components/AuthGuard';
import { useForm } from "react-hook-form";
import { createClient } from '@/utils/supabase/client';

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
  const supabase = createClient();
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
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      setGames(data);
    }
  }

  async function fetchVideos(gameId: string) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
  }

  async function onSubmit(values: GameForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to create a game');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Creating game...');

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert([{
        date: values.date,
        name: values.label,
        opponent: values.teamRole === 'opponent' ? values.label : undefined,
        user_id: user.id
      }])
      .select()
      .single();

    if (gameError) {
      setUploadStatus('Error: ' + gameError.message);
      setIsUploading(false);
      return;
    }

    setUploadStatus('Game created successfully!');

    if (values.video && values.video.length > 0) {
      const videoFile = values.video[0];
      setUploadStatus('Uploading video...');

      const fileName = gameData.id + '/' + Date.now() + '_' + videoFile.name;
      const { error: uploadError } = await supabase.storage
        .from('game_videos')
        .upload(fileName, videoFile);

      if (uploadError) {
        setUploadStatus('Error uploading video: ' + uploadError.message);
      } else {
        const { data: videoData } = await supabase
          .from('videos')
          .insert([{
            name: videoFile.name,
            file_path: fileName,
            game_id: gameData.id
          }])
          .select()
          .single();

        if (videoData) {
          setVideos([videoData, ...videos]);
        }
        setUploadStatus('Video uploaded successfully!');
      }
    }

    setGames([gameData, ...games]);
    setSelectedGame(gameData);
    reset();
    setIsUploading(false);

    setTimeout(() => {
      setUploadStatus('');
    }, 3000);
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Film Analysis</h1>
            <p className="text-xl text-gray-600">Upload and analyze game footage</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Game</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Date</label>
                  <input
                    {...register('date', { required: 'Date is required' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Label</label>
                  <input
                    {...register('label', { required: 'Label is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., vs Eagles"
                  />
                  {errors.label && <p className="text-red-600 text-sm mt-1">{errors.label.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Role</label>
                  <select
                    {...register('teamRole', { required: 'Please select team role' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select role</option>
                    <option value="ours">Our Team</option>
                    <option value="opponent">Opponent</option>
                  </select>
                  {errors.teamRole && <p className="text-red-600 text-sm mt-1">{errors.teamRole.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Game Video (Optional)</label>
                  <input
                    {...register('video')}
                    type="file"
                    accept="video/*"
                    className="block w-full text-sm text-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? 'Creating...' : 'Create Game'}
                </button>

                {uploadStatus && (
                  <div className={uploadStatus.includes('Error') ? 'text-red-700 bg-red-50 p-3 rounded' : 'text-green-700 bg-green-50 p-3 rounded'}>
                    {uploadStatus}
                  </div>
                )}
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Games</h2>
              
              <div className="space-y-3">
                {games.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No games yet</p>
                ) : (
                  games.map(game => (
                    <div
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      className={selectedGame?.id === game.id ? 'p-4 rounded-lg border-2 border-blue-500 bg-blue-50 cursor-pointer' : 'p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50'}
                    >
                      <h3 className="font-semibold text-lg text-gray-900">{game.name}</h3>
                      <p className="text-sm text-gray-600">
                        {game.date ? new Date(game.date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {selectedGame && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Videos for {selectedGame.name} ({videos.length})
                  </h3>
                  <div className="space-y-2">
                    {videos.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No videos yet</p>
                    ) : (
                      videos.map(video => (
                        <div key={video.id} className="p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900">{video.name}</h4>
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
    </AuthGuard>
  );
}