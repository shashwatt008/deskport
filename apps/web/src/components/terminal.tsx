"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TerminalProps {
  sessionId: string;
  wsUrl: string;
  readOnly?: boolean;
}

export function TerminalView({ sessionId, wsUrl, readOnly = false }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    let disposed = false;

    async function initTerminal() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      if (disposed || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: !readOnly,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        theme: {
          background: "#0f1117",
          foreground: "#e4e4e7",
          cursor: "#3b82f6",
          selectionBackground: "#3b82f644",
          black: "#09090b",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          magenta: "#a855f7",
          cyan: "#06b6d4",
          white: "#e4e4e7",
          brightBlack: "#52525b",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#facc15",
          brightBlue: "#60a5fa",
          brightMagenta: "#c084fc",
          brightCyan: "#22d3ee",
          brightWhite: "#fafafa",
        },
        disableStdin: readOnly,
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.open(terminalRef.current);

      fitAddon.fit();
      termRef.current = term;
      fitAddonRef.current = fitAddon;

      // WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setStatus("connected");
        // Send initial terminal size
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: term.cols,
            rows: term.rows,
          })
        );
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "output") {
            term.write(msg.data);
          }
        } catch {
          // If not JSON, write raw data
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        if (disposed) return;
        setStatus("disconnected");
      };

      ws.onclose = () => {
        if (disposed) return;
        setStatus("disconnected");
        term.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
      };

      // Send keyboard input to the server (unless read-only)
      if (!readOnly) {
        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "input", data }));
          }
        });
      }

      // Handle resize
      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });
    }

    initTerminal();

    // Handle window resize
    function handleResize() {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (termRef.current) {
        termRef.current.dispose();
        termRef.current = null;
      }
    };
  }, [sessionId, wsUrl, readOnly]);

  return (
    <div className="flex h-full flex-col bg-[#0f1117]">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Session {sessionId.slice(0, 8)}
          </span>
          {readOnly && (
            <Badge variant="secondary" className="text-xs">
              Monitoring
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              status === "connected"
                ? "bg-green-500"
                : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
            }`}
          />
          <span className="text-xs text-muted-foreground capitalize">
            {status}
          </span>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-1" />
    </div>
  );
}
