"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

interface OrgSettings {
  name: string;
  slug: string;
  defaultSessionTimeout: number;
  enforceTemplates: boolean;
  allowSelfRegistration: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrgSettings>({
    name: "",
    slug: "",
    defaultSessionTimeout: 3600,
    enforceTemplates: true,
    allowSelfRegistration: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.get<OrgSettings>("/api/settings");
      setSettings(data);
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await api.put("/api/settings", {
        name: settings.name,
        defaultSessionTimeout: settings.defaultSessionTimeout,
        enforceTemplates: settings.enforceTemplates,
        allowSelfRegistration: settings.allowSelfRegistration,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled by API client
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your organization settings.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              General settings for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  value={settings.name}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input value={settings.slug} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">
                  The organization slug cannot be changed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Default Session Timeout (seconds)
              </label>
              <Input
                type="number"
                min="60"
                value={settings.defaultSessionTimeout}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultSessionTimeout: parseInt(e.target.value, 10) || 3600,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum session duration when not specified by a template.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Enforce Templates</p>
                  <p className="text-xs text-muted-foreground">
                    Require all sessions to use a template configuration.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enforceTemplates}
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      enforceTemplates: !s.enforceTemplates,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings.enforceTemplates ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      settings.enforceTemplates
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Allow Self-Registration</p>
                  <p className="text-xs text-muted-foreground">
                    Let users register without an invitation.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.allowSelfRegistration}
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      allowSelfRegistration: !s.allowSelfRegistration,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    settings.allowSelfRegistration ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      settings.allowSelfRegistration
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {saved && (
              <span className="text-sm text-green-500">
                Settings saved successfully.
              </span>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
