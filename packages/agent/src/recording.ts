// ── Asciicast v2 Recording ──────────────────────────────────────
// Format: https://docs.asciinema.org/manual/asciicast/v2/
//
// Line 1: JSON header object
// Lines 2+: JSON event arrays [time, type, data]

export interface AsciicastHeader {
  version: 2;
  width: number;
  height: number;
  timestamp: number;
  title?: string;
  env?: Record<string, string>;
}

export type AsciicastEventType = 'o' | 'i'; // output | input

export interface AsciicastEvent {
  time: number;
  type: AsciicastEventType;
  data: string;
}

export class Recording {
  private header: AsciicastHeader;
  private events: string[] = [];
  private startTime: number;
  private ended = false;
  private readonly sessionId: string;

  constructor(sessionId: string, cols: number, rows: number) {
    this.sessionId = sessionId;
    this.startTime = Date.now();

    this.header = {
      version: 2,
      width: cols,
      height: rows,
      timestamp: Math.floor(this.startTime / 1000),
      title: `DeskPort Session ${sessionId}`,
      env: {
        SHELL: process.env.SHELL || '/bin/bash',
        TERM: 'xterm-256color',
      },
    };
  }

  /**
   * Record terminal output data.
   */
  writeOutput(data: string): void {
    if (this.ended) return;
    this.addEvent('o', data);
  }

  /**
   * Record terminal input data.
   */
  writeInput(data: string): void {
    if (this.ended) return;
    this.addEvent('i', data);
  }

  /**
   * Update terminal dimensions (e.g., after resize).
   */
  updateDimensions(cols: number, rows: number): void {
    this.header.width = cols;
    this.header.height = rows;
  }

  /**
   * Finalize the recording and return the complete asciicast v2 content.
   * Returns the full file content as a string (header line + event lines).
   */
  endRecording(): string {
    this.ended = true;

    const lines: string[] = [
      JSON.stringify(this.header),
      ...this.events,
    ];

    return lines.join('\n') + '\n';
  }

  /**
   * Get the number of recorded events.
   */
  get eventCount(): number {
    return this.events.length;
  }

  /**
   * Get the duration of the recording in seconds.
   */
  get duration(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Whether the recording has been finalized.
   */
  get isEnded(): boolean {
    return this.ended;
  }

  // ── Private ─────────────────────────────────────────────────
  private addEvent(type: AsciicastEventType, data: string): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    // Asciicast v2 event format: [time, type, data]
    const event = JSON.stringify([elapsed, type, data]);
    this.events.push(event);
  }
}

// ── Factory ─────────────────────────────────────────────────────
export function startRecording(
  sessionId: string,
  cols: number = 80,
  rows: number = 24,
): Recording {
  return new Recording(sessionId, cols, rows);
}
