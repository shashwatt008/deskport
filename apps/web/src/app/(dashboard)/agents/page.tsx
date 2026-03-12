"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Check, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  hostname: string;
  os: string;
  status: "online" | "offline" | "degraded";
  lastHeartbeat: string;
}

function statusColor(status: string) {
  switch (status) {
    case "online":
      return "default";
    case "offline":
      return "secondary";
    case "degraded":
      return "destructive";
    default:
      return "outline";
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await api.get<Agent[]>("/api/agents");
      setAgents(data);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateApiKey() {
    setGenerating(true);
    try {
      const data = await api.post<{ apiKey: string }>("/api/agents/register");
      setApiKey(data.apiKey);
    } catch {
      setApiKey("error-generating-key");
    } finally {
      setGenerating(false);
    }
  }

  function copyKey() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage connected machines and agent installations.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Agent</DialogTitle>
              <DialogDescription>
                Install the DeskPort agent on your target machine and use the API
                key below to register it.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Install the agent</p>
                <div className="rounded-lg bg-muted p-3">
                  <code className="text-sm text-foreground">
                    curl -fsSL https://get.deskport.dev | sh
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">2. Get your API key</p>
                {apiKey ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-muted p-3">
                      <code className="text-sm text-foreground break-all">
                        {apiKey}
                      </code>
                    </div>
                    <Button variant="outline" size="icon" onClick={copyKey}>
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={generateApiKey}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? "Generating..." : "Generate API Key"}
                  </Button>
                )}
                {apiKey && (
                  <p className="text-xs text-destructive">
                    Save this key now. It will not be shown again.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Start the agent</p>
                <div className="rounded-lg bg-muted p-3">
                  <code className="text-sm text-foreground">
                    deskport agent start --api-key YOUR_KEY
                  </code>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Monitor className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No agents connected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first agent to get started.
          </p>
          <Button
            className="mt-4"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Agent
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Heartbeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {agent.hostname}
                  </TableCell>
                  <TableCell>{agent.os}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {timeAgo(agent.lastHeartbeat)}
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
