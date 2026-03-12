"use client";

import { useEffect, useState } from "react";
import { Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Session {
  id: string;
  userId: string;
  userName: string;
  agentId: string;
  agentName: string;
  templateId: string;
  templateName: string;
  status: "active" | "ended" | "error";
  startedAt: string;
  duration: number | null;
}

interface Agent {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "ended":
      return "secondary" as const;
    case "error":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Ongoing";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await api.get<Session[]>("/api/sessions");
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function openNewSessionDialog() {
    setDialogOpen(true);
    try {
      const [agentsData, templatesData, membersData] = await Promise.all([
        api.get<Agent[]>("/api/agents"),
        api.get<Template[]>("/api/templates"),
        api.get<TeamMember[]>("/api/team"),
      ]);
      setAgents(agentsData);
      setTemplates(templatesData);
      setMembers(membersData);
    } catch {
      // Keep empty lists
    }
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/api/sessions", {
        agentId: selectedAgent,
        templateId: selectedTemplate,
        userId: selectedUser,
      });
      setDialogOpen(false);
      setSelectedAgent("");
      setSelectedTemplate("");
      setSelectedUser("");
      await loadSessions();
    } catch {
      // Error handled by API client
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage terminal sessions across your organization.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button onClick={openNewSessionDialog}>
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Start a new terminal session by selecting an agent, template, and
                user.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createSession} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  required
                >
                  <option value="">Select an agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">Select a user</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Session"}
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
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Play className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No sessions yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new session to get started.
          </p>
          <Button className="mt-4" onClick={openNewSessionDialog}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono text-sm">
                    {session.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{session.userName}</TableCell>
                  <TableCell>{session.agentName}</TableCell>
                  <TableCell>{session.templateName}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(session.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(session.duration)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
