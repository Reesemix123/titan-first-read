'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Play {
  id: string;
  play_name: string;
  play_code: string;
  page_number: number;
  image_url?: string;
  is_archived: boolean;
  created_at: string;
  // Add extracted text for PDF view
  extracted_text?: string;
  // Football attributes
  odk?: string;
  off_form?: string;
  off_play?: string;
  play_type?: string;
  personnel?: string;
  form_tree?: string;
  motion_shift?: string;
  off_strength?: string;
  play_direction?: string;
  gap?: string;
  def_front?: string;
  def_coverage?: string;
  def_blitz?: string;
  comments?: string;
  // Special Teams attributes
  st_unit?: string;
  structure_alignment?: string;
  kick_placement_type?: string;
  onside_type?: string;
  coverage_scheme?: string;
  return_type?: string;
  return_landmark?: string;
  punt_structure?: string;
  punt_protection?: string;
  punt_direction_aim?: string;
  coverage_punt?: string;
  pr_call?: string;
  vice_gunner_plan?: string;
  fg_hash_preference?: string;
  fg_operation?: string;
  fake_special_tag?: string;
}

interface PlaybookViewerProps {
  teamId: string;
  teamName: string;
}

export default function PlaybookViewer({ teamId, teamName }: PlaybookViewerProps) {
  const [plays, setPlays] = useState<Play[]>([]);
  const [filteredPlays, setFilteredPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({
    odk: '',
    playType: '',
    stUnit: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPlays();
  }, [teamId]);

  useEffect(() => {
    applyFilters();
  }, [plays, filters, showArchived]);

  const fetchPlays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playbook_plays')
        .select('*')
        .eq('team_id', teamId)
        .order('play_code', { ascending: true });

      if (error) throw error;
      setPlays(data || []);
    } catch (error) {
      console.error('Error fetching plays:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = plays.filter(play => showArchived ? play.is_archived : !play.is_archived);

    if (filters.odk) {
      filtered = filtered.filter(play => play.odk === filters.odk);
    }

    if (filters.playType) {
      filtered = filtered.filter(play => play.play_type === filters.playType);
    }

    if (filters.stUnit) {
      filtered = filtered.filter(play => play.st_unit === filters.stUnit);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(play => 
        play.play_name.toLowerCase().includes(searchLower) ||
        play.play_code.toLowerCase().includes(searchLower) ||
        play.comments?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPlays(filtered);
  };

  const toggleArchivePlay = async (playId: string, currentArchiveStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('playbook_plays')
        .update({ is_archived: !currentArchiveStatus })
        .eq('id', playId);

      if (error) throw error;

      setPlays(prev => 
        prev.map(play => 
          play.id === playId 
            ? { ...play, is_archived: !currentArchiveStatus }
            : play
        )
      );

      if (selectedPlay?.id === playId) {
        setSelectedPlay(prev => 
          prev ? { ...prev, is_archived: !currentArchiveStatus } : null
        );
      }
    } catch (error) {
      console.error('Error toggling archive status:', error);
      alert('Error updating play status. Please try again.');
    }
  };

  const deletePlay = async (playId: string, playName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${playName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Attempting to delete play:', { playId, playName });
      
      const { error } = await supabase
        .from('playbook_plays')
        .delete()
        .eq('id', playId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Play deleted successfully from database');

      // Update local state only after successful database deletion
      setPlays(prev => {
        const newPlays = prev.filter(play => play.id !== playId);
        console.log('Updated plays state, removed play:', playId);
        console.log('Remaining plays count:', newPlays.length);
        return newPlays;
      });
      
      if (selectedPlay?.id === playId) {
        setSelectedPlay(null);
      }

      alert(`"${playName}" has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting play:', error);
      alert(`Error deleting play: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const getPlayAttributes = (play: Play): string[] => {
    const attributes = [];
    if (play.odk) attributes.push(play.odk);
    if (play.play_type) attributes.push(play.play_type);
    if (play.off_form) attributes.push(play.off_form);
    if (play.st_unit) attributes.push(play.st_unit);
    if (play.personnel) attributes.push(play.personnel);
    return attributes;
  };

  const uniqueValues = (field: keyof Play) => {
    const values = plays
      .map(play => play[field])
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort();
    return values as string[];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{teamName} Playbook</h2>
          <p className="text-gray-600">
            {filteredPlays.length} plays {showArchived ? '(archived)' : '(active)'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showArchived 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search plays..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ODK</label>
            <select
              value={filters.odk}
              onChange={(e) => setFilters(prev => ({ ...prev, odk: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="">All</option>
              {uniqueValues('odk').map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Play Type</label>
            <select
              value={filters.playType}
              onChange={(e) => setFilters(prev => ({ ...prev, playType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="">All</option>
              {uniqueValues('play_type').map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ST Unit</label>
            <select
              value={filters.stUnit}
              onChange={(e) => setFilters(prev => ({ ...prev, stUnit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            >
              <option value="">All</option>
              {uniqueValues('st_unit').map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Plays Display */}
      {filteredPlays.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {showArchived ? 'No archived plays found' : 'No active plays found'}
          </p>
          {!showArchived && (
            <p className="text-gray-400 text-sm mt-2">
              Upload a playbook PDF to get started
            </p>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredPlays.map((play) => (
            <div
              key={play.id}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
              }`}
            >
              {/* Play Image */}
              {play.image_url && (
                <div className={viewMode === 'list' ? 'w-16 h-16 mr-4' : 'aspect-video mb-3'}>
                  <img
                    src={play.image_url}
                    alt={play.play_name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              )}
              
              {/* Play Info */}
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{play.play_name}</h3>
                    <p className="text-xs text-gray-500">{play.play_code}</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedPlay(play)}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => toggleArchivePlay(play.id, play.is_archived)}
                      className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                      title={play.is_archived ? 'Unarchive' : 'Archive'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4 4-4m6 5l-1 1a2 2 0 01-2.828 0L10 9m-7 9a2 2 0 002 2h8a2 2 0 002-2l-3-3a2 2 0 00-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2l2.586 0z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => deletePlay(play.id, play.play_name)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete permanently"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Attributes */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {getPlayAttributes(play).slice(0, 3).map((attr, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
                
                {/* Comments preview */}
                {play.comments && (
                  <p className="text-xs text-gray-500 truncate">{play.comments}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Play Detail Modal */}
      {selectedPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPlay.play_name}</h3>
                  <p className="text-gray-600">{selectedPlay.play_code}</p>
                </div>
                <button
                  onClick={() => setSelectedPlay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Play Image */}
              {selectedPlay.image_url && (
                <div className="mb-6">
                  <img
                    src={selectedPlay.image_url}
                    alt={selectedPlay.play_name}
                    className="w-full max-w-2xl mx-auto rounded-lg border"
                  />
                </div>
              )}
              
              {/* Play Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Play Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPlay.odk && <div><span className="font-medium text-gray-900">ODK:</span> <span className="text-gray-800">{selectedPlay.odk}</span></div>}
                    {selectedPlay.play_type && <div><span className="font-medium text-gray-900">Play Type:</span> <span className="text-gray-800">{selectedPlay.play_type}</span></div>}
                    {selectedPlay.off_form && <div><span className="font-medium text-gray-900">Formation:</span> <span className="text-gray-800">{selectedPlay.off_form}</span></div>}
                    {selectedPlay.personnel && <div><span className="font-medium text-gray-900">Personnel:</span> <span className="text-gray-800">{selectedPlay.personnel}</span></div>}
                    {selectedPlay.st_unit && <div><span className="font-medium text-gray-900">ST Unit:</span> <span className="text-gray-800">{selectedPlay.st_unit}</span></div>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Additional Info</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-900">Play ID:</span> <span className="text-gray-800">{selectedPlay.id}</span></div>
                    <div><span className="font-medium text-gray-900">Page:</span> <span className="text-gray-800">{selectedPlay.page_number}</span></div>
                    <div><span className="font-medium text-gray-900">Created:</span> <span className="text-gray-800">{new Date(selectedPlay.created_at).toLocaleDateString()}</span></div>
                    <div><span className="font-medium text-gray-900">Status:</span> <span className="text-gray-800">{selectedPlay.is_archived ? 'Archived' : 'Active'}</span></div>
                  </div>
                </div>
              </div>
              
              {/* Comments */}
              {selectedPlay.comments && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Comments</h4>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{selectedPlay.comments}</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => toggleArchivePlay(selectedPlay.id, selectedPlay.is_archived)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  {selectedPlay.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => {
                    deletePlay(selectedPlay.id, selectedPlay.play_name);
                    setSelectedPlay(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}