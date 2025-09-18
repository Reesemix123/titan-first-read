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
      const { data: gameData, error: gameError } =