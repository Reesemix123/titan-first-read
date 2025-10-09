'use client';

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from '@/components/AuthGuard';
import { useForm } from "react-hook-form";
import { createClient } from '@/utils/supabase/client';
import { COMMON_ATTRIBUTES, PLAY_RESULTS } from '@/config/footballConfig';

interface Game {
  id: string;
  name: string;
  opponent?: string;
  date?: string;
  team_id: string;
}

interface Video {
  id: string;
  name: string;
  file_path?: string;
  game_id?: string;
}

interface Play {
  play_code: string;
  play_name: string;
  attributes: any;
}

interface PlayInstance {
  id: string;
  video_id: string;
  play_code: string;
  team_id: string;
  timestamp_start: number;
  timestamp_end?: number;
  down?: number;
  distance?: number;
  yard_line?: number;
  hash_mark?: string;
  result?: string;
  yards_gained?: number;
  notes?: string;
  tags?: string[];
  play_name?: string;
}

interface PlayTagForm {
  play_code: string;
  down?: number;
  distance?: number;
  yard_line?: number;
  hash_mark?: string;
  result?: string;
  yards_gained?: number;
  notes?: string;
}

// Convert footballConfig arrays to dropdown format
const DOWNS = [
  { value: '1', label: '1st' },
  { value: '2', label: '2nd' },
  { value: '3', label: '3rd' },
  { value: '4', label: '4th' }
];

const HASH_MARKS = COMMON_ATTRIBUTES.hash.map(h => ({ 
  value: h.toLowerCase(), 
  label: h 
}));

const RESULTS = PLAY_RESULTS.outcome.map(r => ({ 
  value: r.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''), 
  label: r 
}));

export default function GameFilmPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const gameId = params.gameId as string;
  
  const [game, setGame] = useState<Game | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [plays, setPlays] = useState<Play[]>([]);
  const [playInstances, setPlayInstances] = useState<PlayInstance[]>([]);
  
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<PlayInstance | null>(null);
  const [tagStartTime, setTagStartTime] = useState<number>(0);
  const [tagEndTime, setTagEndTime] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isSettingEndTime, setIsSettingEndTime] = useState(false);
  const [showQuickAddPlay, setShowQuickAddPlay] = useState(false);
  const [quickPlayName, setQuickPlayName] = useState('');
  const [quickPlayODK, setQuickPlayODK] = useState<'offense' | 'defense' | 'specialTeams'>('offense');
  const [isAddingPlay, setIsAddingPlay] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlayTagForm>();

  useEffect(() => {
    if (gameId) {
      fetchGame();
      fetchVideos();
    }
  }, [gameId]);

  useEffect(() => {
    if (game?.team_id) {
      fetchPlays();
    }
  }, [game]);

  useEffect(() => {
    if (selectedVideo) {
      loadVideo(selectedVideo);
      fetchPlayInstances(selectedVideo.id);
    } else if (videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  }, [selectedVideo, videos]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setVideoDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [selectedVideo]);

  async function fetchGame() {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!error && data) {
      setGame(data);
    }
  }

  async function fetchVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
  }

  async function fetchPlays() {
    if (!game?.team_id) return;

    const { data, error } = await supabase
      .from('playbook_plays')
      .select('play_code, play_name, attributes')
      .eq('team_id', game.team_id)
      .eq('is_archived', false)
      .order('play_code', { ascending: true });

    if (!error && data) {
      setPlays(data);
    }
  }

  async function generateNextPlayCode(): Promise<string> {
    if (!game?.team_id) return 'P-001';

    const { data } = await supabase
      .from('playbook_plays')
      .select('play_code')
      .eq('team_id', game.team_id)
      .order('play_code', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return 'P-001';

    const lastCode = data[0].play_code;
    const match = lastCode.match(/P-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `P-${nextNum.toString().padStart(3, '0')}`;
    }
    return 'P-001';
  }

  async function handleQuickAddPlay() {
    if (!quickPlayName.trim() || !game?.team_id) {
      alert('Please enter a play name');
      return;
    }

    setIsAddingPlay(true);

    const playCode = await generateNextPlayCode();

    const newPlay = {
      team_id: game.team_id,
      play_code: playCode,
      play_name: quickPlayName.trim(),
      attributes: {
        odk: quickPlayODK,
        formation: '',
        customTags: []
      },
      diagram: {
        players: [],
        routes: [],
        formation: '',
        odk: quickPlayODK
      },
      is_archived: false
    };

    const { data, error } = await supabase
      .from('playbook_plays')
      .insert([newPlay])
      .select()
      .single();

    if (error) {
      alert('Error adding play: ' + error.message);
      setIsAddingPlay(false);
      return;
    }

    // Refresh plays list
    await fetchPlays();

    // Auto-select the new play
    setValue('play_code', playCode);

    // Reset form
    setQuickPlayName('');
    setQuickPlayODK('offense');
    setShowQuickAddPlay(false);
    setIsAddingPlay(false);
  }

  async function fetchPlayInstances(videoId: string) {
    const { data, error } = await supabase
      .from('play_instances')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp_start', { ascending: true });

    if (!error && data) {
      const instancesWithNames = await Promise.all(
        data.map(async (instance) => {
          const { data: playData } = await supabase
            .from('playbook_plays')
            .select('play_name')
            .eq('play_code', instance.play_code)
            .eq('team_id', instance.team_id)
            .single();

          return {
            ...instance,
            play_name: playData?.play_name || 'Unknown Play'
          };
        })
      );
      setPlayInstances(instancesWithNames);
    }
  }

  async function loadVideo(video: Video) {
    if (!video.file_path) return;

    const { data } = await supabase.storage
      .from('game_videos')
      .createSignedUrl(video.file_path, 3600);

    if (data?.signedUrl) {
      setVideoUrl(data.signedUrl);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !game) return;

    setUploadingVideo(true);

    const fileName = `${game.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage
      .from('game_videos')
      .upload(fileName, file);

    if (uploadError) {
      alert('Error uploading video: ' + uploadError.message);
      setUploadingVideo(false);
      return;
    }

    const { data: videoData } = await supabase
      .from('videos')
      .insert([{
        name: file.name,
        file_path: fileName,
        game_id: game.id
      }])
      .select()
      .single();

    if (videoData) {
      setVideos([videoData, ...videos]);
      setSelectedVideo(videoData);
    }

    setUploadingVideo(false);
  }

  function handleMarkPlayStart() {
    if (!videoRef.current) return;
    setTagStartTime(videoRef.current.currentTime);
    setTagEndTime(null);
    setIsSettingEndTime(true);
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  }

  function handleMarkPlayEnd() {
    if (!videoRef.current) return;
    setTagEndTime(videoRef.current.currentTime);
    setIsSettingEndTime(false);
    setShowTagModal(true);
    videoRef.current.pause();
  }

  function handleEditInstance(instance: PlayInstance) {
    setEditingInstance(instance);
    setTagStartTime(instance.timestamp_start);
    setTagEndTime(instance.timestamp_end || null);
    
    // Populate form with existing values
    setValue('play_code', instance.play_code);
    setValue('down', instance.down);
    setValue('distance', instance.distance);
    setValue('yard_line', instance.yard_line);
    setValue('hash_mark', instance.hash_mark || '');
    setValue('result', instance.result || '');
    setValue('yards_gained', instance.yards_gained);
    setValue('notes', instance.notes || '');
    
    setShowTagModal(true);
  }

  async function onSubmitTag(values: PlayTagForm) {
    if (!selectedVideo || !game?.team_id) return;

    const instanceData = {
      video_id: selectedVideo.id,
      play_code: values.play_code,
      team_id: game.team_id,
      timestamp_start: tagStartTime,
      timestamp_end: tagEndTime || undefined,
      down: values.down ? parseInt(String(values.down)) : undefined,
      distance: values.distance ? parseInt(String(values.distance)) : undefined,
      yard_line: values.yard_line ? parseInt(String(values.yard_line)) : undefined,
      hash_mark: values.hash_mark || undefined,
      result: values.result || undefined,
      yards_gained: values.yards_gained ? parseInt(String(values.yards_gained)) : undefined,
      notes: values.notes || undefined,
      tags: []
    };

    if (editingInstance) {
      // Update existing play instance
      const { error } = await supabase
        .from('play_instances')
        .update(instanceData)
        .eq('id', editingInstance.id);

      if (error) {
        alert('Error updating play: ' + error.message);
        return;
      }
    } else {
      // Insert new play instance
      const { error } = await supabase
        .from('play_instances')
        .insert([instanceData]);

      if (error) {
        alert('Error tagging play: ' + error.message);
        return;
      }
    }

    setShowTagModal(false);
    setEditingInstance(null);
    setShowQuickAddPlay(false);
    setQuickPlayName('');
    setQuickPlayODK('offense');
    reset();
    fetchPlayInstances(selectedVideo.id);
  }

  function jumpToPlay(timestamp: number, endTimestamp?: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      
      // Auto-pause at end if defined
      if (endTimestamp) {
        const checkTime = setInterval(() => {
          if (videoRef.current && videoRef.current.currentTime >= endTimestamp) {
            videoRef.current.pause();
            clearInterval(checkTime);
          }
        }, 100);
      }
    }
  }

  async function deletePlayInstance(instanceId: string) {
    if (!confirm('Delete this play tag? This cannot be undone.')) return;

    const { error } = await supabase
      .from('play_instances')
      .delete()
      .eq('id', instanceId);

    if (!error && selectedVideo) {
      fetchPlayInstances(selectedVideo.id);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getPlayColor(index: number): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    return colors[index % colors.length];
  }

  function getDownLabel(value: string): string {
    const down = DOWNS.find(d => d.value === value);
    return down?.label || value;
  }

  function getHashLabel(value: string): string {
    const hash = HASH_MARKS.find(h => h.value === value);
    return hash?.label || value;
  }

  if (!game) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/film')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-4 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to All Games</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{game.name}</h1>
                {game.opponent && (
                  <p className="text-lg text-gray-700 font-semibold mt-1">vs {game.opponent}</p>
                )}
                <p className="text-gray-600 font-medium">
                  {game.date ? new Date(game.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No date set'}
                </p>
              </div>

              <div>
                <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer font-semibold transition-colors">
                  {uploadingVideo ? 'Uploading...' : '+ Add Video'}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploadingVideo}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Video Selector */}
          {videos.length > 1 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Select Video:</label>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={selectedVideo?.id === video.id
                      ? 'px-4 py-2 bg-indigo-600 text-white rounded whitespace-nowrap font-medium transition-colors'
                      : 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 whitespace-nowrap font-medium transition-colors'
                    }
                  >
                    {video.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {selectedVideo && videoUrl ? (
                <>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedVideo.name}</h2>
                    
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: '600px' }}
                    />

                    <div className="mt-4 space-y-4">
                      {/* Timeline Visualization */}
                      {videoDuration > 0 && (
                        <div className="relative h-12 bg-gray-200 rounded overflow-hidden">
                          {/* Current time indicator */}
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-red-500 z-20"
                            style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                          />
                          
                          {/* Tagged plays on timeline */}
                          {playInstances.map((instance, index) => {
                            const startPercent = (instance.timestamp_start / videoDuration) * 100;
                            const endPercent = instance.timestamp_end 
                              ? (instance.timestamp_end / videoDuration) * 100 
                              : startPercent + 1;
                            const width = endPercent - startPercent;
                            
                            return (
                              <div
                                key={instance.id}
                                className="absolute top-0 bottom-0 opacity-70 hover:opacity-100 cursor-pointer group transition-opacity"
                                style={{
                                  left: `${startPercent}%`,
                                  width: `${width}%`,
                                  backgroundColor: getPlayColor(index)
                                }}
                                onClick={() => jumpToPlay(instance.timestamp_start, instance.timestamp_end || undefined)}
                              >
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-30">
                                  {instance.play_code} - {formatTime(instance.timestamp_start)}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Time labels */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-gray-700 pointer-events-none">
                            <span>0:00</span>
                            <span>{formatTime(videoDuration)}</span>
                          </div>
                        </div>
                      )}

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-800">
                          Current Time: <span className="text-indigo-600">{formatTime(currentTime)}</span>
                          {videoDuration > 0 && <span className="text-gray-600"> / {formatTime(videoDuration)}</span>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!isSettingEndTime ? (
                            <button
                              onClick={handleMarkPlayStart}
                              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold transition-colors"
                            >
                              ⏺ Mark Start
                            </button>
                          ) : (
                            <>
                              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded font-semibold text-sm">
                                Recording from {formatTime(tagStartTime)}
                              </div>
                              <button
                                onClick={handleMarkPlayEnd}
                                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors"
                              >
                                ⏹ Mark End
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">How to Tag Plays:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 font-medium">
                      <li>Click "Mark Start" at the beginning of a play</li>
                      <li>Let the video play through the entire play</li>
                      <li>Click "Mark End" when the play finishes</li>
                      <li>Fill in play details and save</li>
                    </ol>
                    <p className="mt-2 text-xs text-blue-700">
                      Tip: Precise start/end times are critical for AI analysis and creating play clips
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700 text-lg mb-4 font-medium">No video for this game yet</p>
                  <div className="text-center">
                    <label className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-semibold transition-colors">
                      Upload Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 150MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tagged Plays List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tagged Plays ({playInstances.length})
              </h3>
              
              {playInstances.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p className="text-gray-700 text-sm font-medium">
                    No plays tagged yet.<br/>
                    Use "Mark Start/End" to tag plays.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {playInstances.map((instance, index) => (
                    <div 
                      key={instance.id} 
                      className="border-2 rounded-lg p-3 hover:shadow-md transition-shadow"
                      style={{ borderColor: getPlayColor(index) }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: getPlayColor(index) }}
                            >
                              {index + 1}
                            </span>
                            <span className="font-bold text-indigo-600">{instance.play_code}</span>
                          </div>
                          <p className="text-sm text-gray-900 font-semibold mt-1 ml-8">{instance.play_name}</p>
                        </div>
                        
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditInstance(instance)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deletePlayInstance(instance.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1 text-gray-800 mb-2 font-medium">
                        <div className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                          <span>Duration:</span>
                          <span className="font-bold">
                            {formatTime(instance.timestamp_start)} 
                            {instance.timestamp_end && ` - ${formatTime(instance.timestamp_end)}`}
                            {instance.timestamp_end && (
                              <span className="text-indigo-600 ml-1">
                                ({Math.round(instance.timestamp_end - instance.timestamp_start)}s)
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {instance.down && instance.distance && (
                          <div className="flex items-center justify-between">
                            <span>Situation:</span>
                            <span className="font-bold">
                              {getDownLabel(String(instance.down))} & {instance.distance}
                            </span>
                          </div>
                        )}
                        
                        {instance.yard_line && (
                          <div className="flex items-center justify-between">
                            <span>Yard Line:</span>
                            <span className="font-bold">
                              {instance.yard_line}
                              {instance.hash_mark && ` (${getHashLabel(instance.hash_mark)})`}
                            </span>
                          </div>
                        )}
                        
                        {instance.result && (
                          <div className="bg-indigo-50 rounded px-2 py-1 mt-1">
                            <span className="font-semibold text-gray-800">Result:</span> 
                            <span className="text-gray-900 font-bold ml-1">{instance.result}</span>
                          </div>
                        )}
                        
                        {instance.yards_gained !== null && instance.yards_gained !== undefined && (
                          <div className="flex items-center justify-between">
                            <span>Yards:</span>
                            <span className={`font-bold ${instance.yards_gained >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {instance.yards_gained > 0 ? '+' : ''}{instance.yards_gained}
                            </span>
                          </div>
                        )}
                        
                        {instance.notes && (
                          <div className="italic text-gray-700 mt-1 text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                            "{instance.notes}"
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => jumpToPlay(instance.timestamp_start, instance.timestamp_end || undefined)}
                        className="w-full relative overflow-hidden rounded hover:opacity-90 transition-opacity group"
                      >
                        <div className="w-full h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all">
                            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Play Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {editingInstance ? 'Edit Play Tag' : 'Tag Play'}
            </h3>
            <p className="text-sm text-gray-800 font-medium mb-4">
              {formatTime(tagStartTime)} 
              {tagEndTime && ` - ${formatTime(tagEndTime)}`}
              {tagEndTime && (
                <span className="text-indigo-600 ml-1">
                  ({Math.round(tagEndTime - tagStartTime)}s)
                </span>
              )}
            </p>
            
            <form onSubmit={handleSubmit(onSubmitTag)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Play <span className="text-red-600">*</span>
                </label>
                <select
                  {...register('play_code', { required: 'Please select a play' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select play...</option>
                  {plays.map(play => (
                    <option key={play.play_code} value={play.play_code}>
                      {play.play_code} - {play.play_name}
                    </option>
                  ))}
                </select>
                {errors.play_code && <p className="text-red-600 text-sm mt-1 font-medium">{errors.play_code.message}</p>}
                
                {/* Quick Add Play Link */}
                <button
                  type="button"
                  onClick={() => setShowQuickAddPlay(!showQuickAddPlay)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{showQuickAddPlay ? 'Cancel' : 'Play not in playbook? Add it here'}</span>
                </button>

                {/* Quick Add Form */}
                {showQuickAddPlay && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Add Play</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">
                          Play Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={quickPlayName}
                          onChange={(e) => setQuickPlayName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Inside Zone Right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">
                          Type <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={quickPlayODK}
                          onChange={(e) => setQuickPlayODK(e.target.value as 'offense' | 'defense' | 'specialTeams')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="offense">Offense</option>
                          <option value="defense">Defense</option>
                          <option value="specialTeams">Special Teams</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickAddPlay}
                        disabled={isAddingPlay || !quickPlayName.trim()}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAddingPlay ? 'Adding...' : 'Add Play to Playbook'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      Play code will be auto-generated. You can add formations and routes later in the Playbook page.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Down</label>
                  <select 
                    {...register('down')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-</option>
                    {DOWNS.map(down => (
                      <option key={down.value} value={down.value}>{down.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Distance</label>
                  <input
                    {...register('distance')}
                    type="number"
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="yards"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Yard Line</label>
                  <input
                    {...register('yard_line')}
                    type="number"
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Hash Mark</label>
                  <select 
                    {...register('hash_mark')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-</option>
                    {HASH_MARKS.map(hash => (
                      <option key={hash.value} value={hash.value}>{hash.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Result</label>
                <select 
                  {...register('result')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select result...</option>
                  {RESULTS.map(result => (
                    <option key={result.value} value={result.value}>{result.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Yards Gained</label>
                <input
                  {...register('yards_gained')}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Can be negative for loss"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTagModal(false);
                    setEditingInstance(null);
                    setIsSettingEndTime(false);
                    setShowQuickAddPlay(false);
                    setQuickPlayName('');
                    setQuickPlayODK('offense');
                    reset();
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-semibold text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold transition-colors"
                >
                  {editingInstance ? 'Update Play' : 'Tag Play'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}