"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";
import PlaybookUpload from '@/components/PlaybookUpload';

// Common team colors
const TEAM_COLORS = [
  "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Black", "White", 
  "Navy", "Maroon", "Gold", "Silver", "Gray", "Pink", "Brown", "Teal"
];

// Schemas
const TeamSchema = z.object({
  name: z.string().min(2),
  level: z.string().min(1),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const PlaySchema = z.object({
  name: z.string().min(2),
});

export default function SetupPage() {
  const [tab, setTab] = useState<"playbook" | "plays">("playbook");
  const [teams, setTeams] = useState<any[]>([]);
  const [plays, setPlays] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [teamView, setTeamView] = useState<"list" | "manage">("list");

  const teamForm = useForm({ resolver: zodResolver(TeamSchema) });
  const playForm = useForm({ resolver: zodResolver(PlaySchema) });

useEffect(() => {
  const checkAuth = async () => {
    // Wait a moment for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      console.log('No user found, redirecting to login');
      // You could redirect to login here
      return;
    }

    const { data: myTeams } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });
    setTeams(myTeams ?? []);
  };

  checkAuth();
}, []);

  // Load playbooks for a specific team
  async function loadPlaybooksForTeam(teamId: string) {
    try {
      const { data: files, error } = await supabase.storage
        .from('playbooks')
        .list(teamId);
      
      if (error) {
        console.error('Error loading playbooks:', error);
        return;
      }

      setPlaybooks(files || []);
    } catch (err) {
      console.error('Error loading playbooks:', err);
    }
  }

  // Load plays for a specific team
  async function loadPlaysForTeam(teamId: string) {
    const { data: teamPlays } = await supabase
      .from("playbook_plays")
      .select("*")
      .eq("team_id", teamId)
      .order("play_code");
    setPlays(teamPlays ?? []);
  }

  // Select a team to manage
  function selectTeam(team: any) {
    setSelectedTeam(team);
    setTeamId(team.id);
    setTeamView("manage");
    
    // Load plays and playbooks for this team
    loadPlaysForTeam(team.id);
    loadPlaybooksForTeam(team.id);
  }

  // Delete playbook
  async function deletePlaybook(fileName: string) {
    if (!teamId) return;
    
    const confirmed = confirm(`Delete ${fileName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.storage
        .from('playbooks')
        .remove([`${teamId}/${fileName}`]);

      if (error) {
        console.error('Delete error:', error);
        alert(`Delete failed: ${error.message}`);
        return;
      }

      // Reload playbooks
      await loadPlaybooksForTeam(teamId);
      alert("Playbook deleted successfully");
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Delete failed: ${err}`);
    }
  }

  // Get download URL for playbook
  async function downloadPlaybook(fileName: string) {
    if (!teamId) return;

    try {
      const { data, error } = await supabase.storage
        .from('playbooks')
        .createSignedUrl(`${teamId}/${fileName}`, 3600); // 1 hour expiry

      if (error) {
        console.error('Download error:', error);
        alert(`Download failed: ${error.message}`);
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert(`Download failed: ${err}`);
    }
  }

  // Go back to team list
  function backToTeamList() {
    setTeamView("list");
    setSelectedTeam(null);
    setTeamId(null);
    setPlays([]);
    setPlaybooks([]);
  }

  // Create Team
  async function onCreateTeam(values: any) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return alert("Not signed in");

      console.log("Creating team with values:", values);

      // Create colors object with the three selected colors
      const colorsObject = {
        primary: values.primaryColor || null,
        secondary: values.secondaryColor || null,
        accent: values.accentColor || null,
      };
      const colorsJson = JSON.stringify(colorsObject);

      console.log("Colors JSON:", colorsJson);

      // Try a simpler insert without RLS complications
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: values.name,
          level: values.level,
          colors: colorsJson
        })
        .select()
        .single();
      
      if (error) {
        console.error("Database error:", error);
        alert(`Error creating team: ${error.message}`);
        return;
      }

      console.log("Team created successfully:", data);

      setTeams([data, ...teams]);
      setTeamId(data.id);
      setSelectedTeam(data);
      setTeamView("manage");
      teamForm.reset(); // Clear the form
      alert("Team created ✅");
    } catch (err) {
      console.error("Full error:", err);
      alert(`Error: ${err}`);
    }
  }

  // Add Play
  async function onAddPlay(values: any) {
    if (!teamId) return alert("No team selected");

    // auto-generate next code
    const last = plays.sort((a, b) => a.play_code.localeCompare(b.play_code)).slice(-1)[0];
    const nextCode = last ? `P-${String(Number(last.play_code.split("-")[1]) + 1).padStart(3, "0")}` : "P-001";

    const { data, error } = await supabase
      .from("playbook_plays")
      .insert([{ team_id: teamId, play_code: nextCode, play_name: values.name }])
      .select()
      .single();
    if (error) throw error;

    setPlays([...plays, data]);
    playForm.reset();
    alert("Play added ✅");
  }

  // Delete play
  async function deletePlay(playId: string) {
    if (!confirm('Are you sure you want to delete this play?')) return;

    try {
      const { error } = await supabase
        .from('playbook_plays')
        .delete()
        .eq('id', playId);

      if (error) throw error;
      
      await loadPlaysForTeam(teamId!);
    } catch (error) {
      console.error('Error deleting play:', error);
      alert('Error deleting play');
    }
  };

  // Get confidence badge for extracted plays
  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;
    
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[confidence as keyof typeof colors]}`}>
        {confidence}
      </span>
    );
  };

  return (
    <main className="bg-white min-h-screen">
      {teamView === "list" ? (
        // TEAM LIST VIEW
        <section className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold text-gray-900 mb-4">Teams</h1>
            <p className="text-xl text-gray-600">Manage your teams and configure settings</p>
          </div>
          
          {/* Show existing teams */}
          {teams.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Your Teams</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                    onClick={() => selectTeam(team)}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-gray-600 mb-4">{team.level}</p>
                    {team.colors && (
                      <div className="text-sm text-gray-500 mb-4">
                        {JSON.parse(team.colors).primary && `${JSON.parse(team.colors).primary}`}
                        {JSON.parse(team.colors).secondary && ` • ${JSON.parse(team.colors).secondary}`}
                        {JSON.parse(team.colors).accent && ` • ${JSON.parse(team.colors).accent}`}
                      </div>
                    )}
                    <div className="text-sm text-indigo-600 font-medium">Manage →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create new team form */}
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Create New Team</h2>
            <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                  <input 
                    placeholder="Eagles" 
                    {...teamForm.register("name")} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <input 
                    placeholder="Varsity" 
                    {...teamForm.register("level")} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <select {...teamForm.register("primaryColor")} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Choose...</option>
                    {TEAM_COLORS.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <select {...teamForm.register("secondaryColor")} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Choose...</option>
                    {TEAM_COLORS.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <select {...teamForm.register("accentColor")} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Choose...</option>
                    {TEAM_COLORS.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button type="submit" className="px-8 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors">
                Create Team
              </button>
            </form>
          </div>
        </section>
      ) : (
        // TEAM MANAGEMENT VIEW
        <section className="max-w-7xl mx-auto px-8 py-12">
          {/* Header with back button */}
          <div className="flex items-center gap-6 mb-12">
            <button 
              onClick={backToTeamList}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Teams
            </button>
            <div>
              <h1 className="text-4xl font-semibold text-gray-900">{selectedTeam?.name}</h1>
              <p className="text-xl text-gray-600">{selectedTeam?.level}</p>
            </div>
          </div>

          {/* Tabs for this team */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex gap-8">
              <button 
                onClick={() => setTab("playbook")} 
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  tab === "playbook" 
                    ? "border-gray-800 text-gray-800" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Playbook
              </button>
              <button 
                onClick={() => setTab("plays")} 
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  tab === "plays" 
                    ? "border-gray-800 text-gray-800" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Plays
              </button>
            </nav>
          </div>

          {tab === "playbook" && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Team Playbook</h2>
              
              {/* Enhanced Upload with PDF Extraction */}
              <div className="border border-gray-200 rounded-xl p-8 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Upload New Playbook</h3>
                <PlaybookUpload
                  teamId={teamId!}
                  onPlaysExtracted={(plays) => {
                    console.log('Extracted plays:', plays);
                    // Show success message with play count
                    if (plays.length > 0) {
                      alert(`Found ${plays.length} potential plays in the PDF! Review and select which ones to save.`);
                    }
                  }}
                  onUploadComplete={() => {
                    // Refresh playbooks and plays lists
                    loadPlaybooksForTeam(teamId!);
                    loadPlaysForTeam(teamId!);
                    // Optionally switch to plays tab to see the new plays
                    alert("Upload complete! Check the Plays tab to see your new plays with images.");
                  }}
                />
              </div>

              {/* Existing Playbooks Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Uploaded Playbooks</h3>
                {playbooks.length > 0 ? (
                  <div className="space-y-4">
                    {playbooks.map((file) => (
                      <div key={file.name} className="border border-gray-200 rounded-lg p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {(file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown size')} • 
                              {file.updated_at ? new Date(file.updated_at).toLocaleDateString() : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadPlaybook(file.name)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => deletePlaybook(file.name)}
                            className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-xl">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No playbooks uploaded yet</p>
                    <p className="text-sm mt-1">Upload your first playbook to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "plays" && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Team Plays</h2>
              
              {/* Add Play Form */}
              <div className="border border-gray-200 rounded-xl p-8 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Play</h3>
                <form onSubmit={playForm.handleSubmit(onAddPlay)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Play Name</label>
                    <input 
                      placeholder="e.g., Power Sweep Right" 
                      {...playForm.register("name")} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-600" 
                    />
                    <p className="text-sm text-gray-700 mt-2">Code will be auto-generated (P-001, P-002, etc.)</p>
                  </div>
                  <button type="submit" className="px-8 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors">
                    Add Play
                  </button>
                </form>
              </div>

              {/* Enhanced Plays List with Images */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">All Plays ({plays.length})</h3>
                {plays.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plays.map((play) => (
                      <div key={play.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all">
                        {/* Play Image */}
                        {play.image_url && (
                          <div className="aspect-video bg-gray-100">
                            <img 
                              src={play.image_url} 
                              alt={`Play: ${play.play_name}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Play Details */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-indigo-600 text-sm">{play.play_code}</div>
                            <div className="flex items-center space-x-1">
                              {getConfidenceBadge(play.extraction_confidence)}
                              {play.page_number && (
                                <span className="text-xs text-gray-500">Page {play.page_number}</span>
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-gray-800 mb-2">{play.play_name}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {play.image_url ? 'With image' : 'Text only'}
                            </div>
                            <button
                              onClick={() => deletePlay(play.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600 border border-gray-200 rounded-xl">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="font-medium">No plays added yet</p>
                    <p className="text-sm mt-1">Upload a playbook or add plays manually to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}