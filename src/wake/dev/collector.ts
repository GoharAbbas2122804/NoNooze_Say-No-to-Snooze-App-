import { FrameSignals } from '../contract';

export interface CollectorSessionMeta {
  subjectId: string;
  posture: 'lying' | 'sitting' | 'standing';
  eyes: 'open' | 'closed' | 'mixed';
  lighting: 'dark' | 'dim' | 'bright';
  glasses: 'yes' | 'no';
}

export interface CollectorOptions {
  writeLine?: (line: string) => Promise<void>;
  shareFile?: (filePath: string) => Promise<void>;
}

export interface SessionResult {
  sessionId: string;
  framesRecorded: number;
}

export function createDataCollector(options: CollectorOptions = {}) {
  let activeSession: CollectorSessionMeta | null = null;
  let sessionId: string = '';
  let framesRecorded = 0;
  let consentForCrops = false;

  const defaultWriteLine = async (line: string): Promise<void> => {
    // In production environment, writes to FileSystem.documentDirectory / `sessions_${sessionId}.jsonl`
    // Nothing is uploaded. Local-only.
  };

  const writeLine = options.writeLine ?? defaultWriteLine;

  function setConsent(allowCrops: boolean): void {
    consentForCrops = allowCrops;
  }

  function startSession(meta: CollectorSessionMeta): string {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activeSession = meta;
    framesRecorded = 0;

    const header = {
      type: 'session_header',
      sessionId,
      startedAt: Date.now(),
      ...meta,
      consentForCrops,
    };

    writeLine(JSON.stringify(header));
    return sessionId;
  }

  function recordFrame(signals: FrameSignals, cropBase64?: string): void {
    if (!activeSession) return;
    framesRecorded += 1;

    const record: Record<string, unknown> = {
      type: 'frame',
      sessionId,
      t: signals.t,
      signals,
    };

    // PRIVACY GUARD: Save 48x48 crop ONLY if explicit consent toggle is ON
    if (consentForCrops && cropBase64) {
      record.cropBase64 = cropBase64;
    }

    writeLine(JSON.stringify(record));
  }

  async function endSession(): Promise<SessionResult> {
    const currentId = sessionId;
    const count = framesRecorded;

    if (activeSession) {
      const footer = {
        type: 'session_footer',
        sessionId: currentId,
        endedAt: Date.now(),
        totalFrames: count,
      };
      await writeLine(JSON.stringify(footer));
    }

    activeSession = null;
    sessionId = '';
    framesRecorded = 0;

    return {
      sessionId: currentId,
      framesRecorded: count,
    };
  }

  async function exportSessions(filePath: string): Promise<void> {
    if (options.shareFile) {
      await options.shareFile(filePath);
    }
  }

  return {
    setConsent,
    startSession,
    recordFrame,
    endSession,
    exportSessions,
    isConsentGiven(): boolean {
      return consentForCrops;
    },
  };
}
