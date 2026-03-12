"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
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
import { api } from "@/lib/api";

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  userName: string;
  sessionId: string | null;
  details: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

function eventTypeColor(eventType: string) {
  if (eventType.includes("error") || eventType.includes("fail")) {
    return "destructive" as const;
  }
  if (eventType.includes("create") || eventType.includes("start")) {
    return "default" as const;
  }
  if (eventType.includes("delete") || eventType.includes("remove")) {
    return "destructive" as const;
  }
  return "secondary" as const;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadAuditLog();
  }, [page]);

  async function loadAuditLog() {
    setLoading(true);
    try {
      const data = await api.get<AuditResponse>(
        `/api/audit?page=${page}&pageSize=${pageSize}`
      );
      setEntries(data.entries);
      setTotal(data.total);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all actions and events across your organization.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <ScrollText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No audit events</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Events will appear here as your team uses DeskPort.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={eventTypeColor(entry.eventType)}>
                        {entry.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {entry.sessionId ? entry.sessionId.slice(0, 8) : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {entry.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} events
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
