"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
interface Game {
  id: string;
  name: string;
  opponent?: string;
  date?: string;
  [key: string]: any;
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
  [key: string]: any;
}
export default function FilmPage() {
  const { register, handleSubmit, reset } = useForm<GameForm>();
  const [games, setGames] = useState<Game[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("games").select("*").order("date", { ascending: false });
      setGames(data ?? []);
    })();
  }, []);

  async function onCreate(values: GameForm) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return alert("Not signed in");

    const { data: myTeams } = await supabase.from("team_members").select("team_id").eq("user_id", auth.user.id).limit(1);
    if (!myTeams?.length) return alert("No team membership found");

    const teamId = myTeams[0].team_id;

    const { data: game, error } = await supabase
      .from("games")
      .insert([{ team_id: teamId, date: values.date, label: values.label }])
      .select()
      .single();
    if (error) throw error;

    let storagePath: string | null = null;
    const file = values.video?.[0];
    if (file) {
      storagePath = `${game.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("media").upload(storagePath, file);
      if (upErr) throw upErr;
    }

    const { error: vidErr } = await supabase.from("videos").insert([
      { game_id: game.id, team_role: values.teamRole, storage_url: storagePath, source_url: null },
    ]);
    if (vidErr) throw vidErr;

    const { data: allGames } = await supabase.from("games").select("*").order("date", { ascending: false });
    setGames(allGames ?? []);
    reset();
    alert("Game + video added ✅");
  }

  async function listVideos(gameId: string) {
    const { data } = await supabase.from("videos").select("*").eq("game_id", gameId);
    setVideos(data ?? []);
  }

  async function getSignedUrl(path: string) {
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 30);
    return data?.signedUrl ?? null;
  }

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <form onSubmit={handleSubmit(onCreate)} className="rounded bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold text-indigo-700">Add Game & Video</h1>
        <div className="grid gap-3">
          <input type="date" {...register("date", { required: true })} className="rounded border px-3 py-2" />
          <input type="text" placeholder="Label" {...register("label")} className="rounded border px-3 py-2" />
          <select {...register("teamRole", { required: true })} className="rounded border px-3 py-2">
            <option value="ours">Our Team</option>
            <option value="opponent">Opponent</option>
          </select>
          <input type="file" accept="video/mp4" {...register("video")} className="rounded border px-3 py-2" />
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Save</button>
        </div>
      </form>

      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-2 text-xl font-semibold">Games</h2>
        <ul className="space-y-2">
          {games.map((g) => (
            <li key={g.id} className="rounded border p-2">
              <div className="flex justify-between">
                <span>{g.label ?? g.date}</span>
                <button onClick={() => listVideos(g.id)} className="text-sm text-indigo-600 underline">View videos</button>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 mb-1 font-semibold">Videos</h3>
        <ul className="space-y-2">
          {videos.map((v) => (
            <li key={v.id} className="rounded border p-2">
              <div className="flex justify-between">
                <span>{v.team_role}</span>
                {v.storage_url && (
                  <button
                    className="text-sm text-indigo-600 underline"
                    onClick={async () => {
                      const url = await getSignedUrl(v.storage_url);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    Open MP4
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}