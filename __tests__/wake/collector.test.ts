import { createDataCollector, CollectorSessionMeta } from '../../src/wake/dev/collector';
import { FrameSignals } from '../../src/wake/contract';

function makeFrameSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: 1000,
    faceFound: true,
    leftEyeOpen: 0.9,
    rightEyeOpen: 0.9,
    eyesOpen: 0.9,
    yaw: 0,
    pitch: 0,
    roll: 0,
    upright: 1.0,
    brightness: 0.7,
    faceBox: { x: 0.25, y: 0.2, w: 0.5, h: 0.5 },
    latencyMs: 14,
    source: { mlkit: 0.9, ear: 0.9, cnn: 0.9, fused: 0.9 },
    ...overrides,
  };
}

describe('createDataCollector', () => {
  const meta: CollectorSessionMeta = {
    subjectId: 'user_01',
    posture: 'sitting',
    eyes: 'open',
    lighting: 'bright',
    glasses: 'no',
  };

  it('records session metadata and frame signals as JSONL lines', async () => {
    const writtenLines: string[] = [];
    const collector = createDataCollector({
      writeLine: async (line) => {
        writtenLines.push(line);
      },
    });

    collector.startSession(meta);
    collector.recordFrame(makeFrameSignals({ t: 100 }));
    collector.recordFrame(makeFrameSignals({ t: 200 }));
    const result = await collector.endSession();

    expect(result.framesRecorded).toBe(2);
    expect(writtenLines.length).toBe(4); // 1 header + 2 frames + 1 footer

    const header = JSON.parse(writtenLines[0]);
    expect(header.type).toBe('session_header');
    expect(header.subjectId).toBe('user_01');
    expect(header.posture).toBe('sitting');

    const frame1 = JSON.parse(writtenLines[1]);
    expect(frame1.type).toBe('frame');
    expect(frame1.signals.t).toBe(100);
    // Explicit consent is false by default: cropBase64 must NOT be recorded
    expect(frame1.cropBase64).toBeUndefined();
  });

  it('strictly omits eye crop images unless explicit consent toggle is ON', async () => {
    const writtenLines: string[] = [];
    const collector = createDataCollector({
      writeLine: async (line) => {
        writtenLines.push(line);
      },
    });

    collector.setConsent(false); // Explicitly off
    collector.startSession(meta);
    collector.recordFrame(makeFrameSignals(), 'mock_base64_crop_data');
    await collector.endSession();

    const record = JSON.parse(writtenLines[1]);
    expect(record.cropBase64).toBeUndefined();

    // Now enable consent
    writtenLines.length = 0;
    collector.setConsent(true); // User consented to 48x48 eye crop recording
    collector.startSession(meta);
    collector.recordFrame(makeFrameSignals(), 'mock_base64_crop_data');
    await collector.endSession();

    const consentedRecord = JSON.parse(writtenLines[1]);
    expect(consentedRecord.cropBase64).toBe('mock_base64_crop_data');
  });
});
