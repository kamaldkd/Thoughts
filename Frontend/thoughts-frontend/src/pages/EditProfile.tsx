import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/api";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); // make sure setUser exists in your auth context

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [location, setLocation] = useState(user?.location || "");
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  // 🔥 Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  // 🔥 Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("bio", bio);
      formData.append("website", website);
      formData.append("location", location);
      formData.append("isPrivate", String(isPrivate));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateProfile(formData);
      console.log("UPDATE RESPONSE:", res.data);
      const updatedUser = res.data;
      setUser(updatedUser); // 🔥 update global context

      navigate(`/profile`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
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

        {/* Avatar Section */}
        <div className="flex justify-center py-8">
          <label className="relative group cursor-pointer">
            <img
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : user?.avatar || "/default-avatar.png"
              }
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-right text-muted-foreground">
              {bio.length}/160
            </p>
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Private Account</span>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
