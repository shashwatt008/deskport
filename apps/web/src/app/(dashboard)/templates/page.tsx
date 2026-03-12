"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileCode2, FolderOpen, Wrench, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  description: string;
  allowedDirs: string[];
  tools: string[];
  maxDuration: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowedDirs, setAllowedDirs] = useState("");
  const [tools, setTools] = useState("");
  const [maxDuration, setMaxDuration] = useState("3600");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await api.get<Template[]>("/api/templates");
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setAllowedDirs("");
    setTools("");
    setMaxDuration("3600");
    setDialogOpen(true);
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setAllowedDirs(template.allowedDirs.join(", "));
    setTools(template.tools.join(", "));
    setMaxDuration(String(template.maxDuration));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      description,
      allowedDirs: allowedDirs
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      tools: tools
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      maxDuration: parseInt(maxDuration, 10),
    };

    try {
      if (editingTemplate) {
        await api.put(`/api/templates/${editingTemplate.id}`, payload);
      } else {
        await api.post("/api/templates", payload);
      }
      setDialogOpen(false);
      await loadTemplates();
    } catch {
      // Error handled by API client
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await api.delete(`/api/templates/${id}`);
      await loadTemplates();
    } catch {
      // Error handled by API client
    }
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define sandbox configurations for terminal sessions.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Update the template configuration."
                  : "Define a new sandbox configuration for sessions."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Python Dev Environment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description of this template"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Allowed Directories
                </label>
                <Input
                  placeholder="/home/user, /opt/tools"
                  value={allowedDirs}
                  onChange={(e) => setAllowedDirs(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of directories the user can access.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Allowed Tools</label>
                <Input
                  placeholder="python, pip, git, node"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of CLI tools the user can execute.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Duration (seconds)
                </label>
                <Input
                  type="number"
                  min="60"
                  placeholder="3600"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingTemplate
                      ? "Update Template"
                      : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <FileCode2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No templates yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a template to define session configurations.
          </p>
          <Button className="mt-4" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderOpen className="h-4 w-4" />
                  <span>
                    {template.allowedDirs.length} director
                    {template.allowedDirs.length === 1 ? "y" : "ies"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  <span>
                    {template.tools.length} tool
                    {template.tools.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Max {formatDuration(template.maxDuration)}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {template.tools.slice(0, 5).map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                  {template.tools.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tools.length - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTemplate(template.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
