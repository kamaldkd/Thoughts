import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [username, setUsername] = useState(user?.username || "alex_design");
  const [bio, setBio] = useState(
    "Designer & thinker. Exploring the intersection of simplicity and beauty."
  );
  const [email, setEmail] = useState(user?.email || "alex@example.com");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 border-b border-border/60">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex justify-center py-8">
          <div className="relative group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face"
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
            <div className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-background" />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself…"
              maxLength={160}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              maxLength={50}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 pt-5">
            <h3 className="text-sm font-semibold mb-3">Privacy</h3>
            <label className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm">Private account</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              When enabled, only approved followers can see your thoughts.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
