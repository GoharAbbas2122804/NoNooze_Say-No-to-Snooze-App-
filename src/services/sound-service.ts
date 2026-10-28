import * as DocumentPicker from 'expo-document-picker';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { SoundItem, ALARM_SOUNDS } from '../constants/sounds';

let activePlayer: AudioPlayer | null = null;
let previewTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Configure audio session for alarm playback (plays even in silent mode)
 */
export async function setupAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
  } catch {
    // Graceful fallback if unsupported
  }
}

/**
 * Resolve an audio source from an id, preset name, or local file URI
 */
export function resolveAudioSource(soundIdOrUri: string): any {
  if (!soundIdOrUri) {
    const defaultItem = ALARM_SOUNDS.find((s) => s.isDefault) || ALARM_SOUNDS[0];
    return defaultItem.asset;
  }

  // Check if it is a direct file/content URI
  if (
    soundIdOrUri.startsWith('file://') ||
    soundIdOrUri.startsWith('content://') ||
    soundIdOrUri.startsWith('http://') ||
    soundIdOrUri.startsWith('https://')
  ) {
    return { uri: soundIdOrUri };
  }

  // Look up in alarm catalog
  const match = ALARM_SOUNDS.find(
    (s) => s.id === soundIdOrUri || s.name.toLowerCase() === soundIdOrUri.toLowerCase()
  );

  if (match?.asset) {
    return match.asset;
  }

  if (match?.uri) {
    return { uri: match.uri };
  }

  // Fallback to default Melodian
  return ALARM_SOUNDS[0]?.asset;
}

/**
 * Play alarm audio (with looping for ringing screens)
 */
export async function playAlarmAudio(
  soundIdOrUri: string,
  volume = 80,
  loop = true
): Promise<void> {
  try {
    stopAlarmAudio();
    await setupAudioMode();

    const source = resolveAudioSource(soundIdOrUri);
    if (!source) return;

    activePlayer = createAudioPlayer(source);

    if (activePlayer) {
      activePlayer.loop = loop;
      if (typeof (activePlayer as any).setVolume === 'function') {
        (activePlayer as any).setVolume(Math.max(0.05, Math.min(1.0, volume / 100)));
      }
      activePlayer.play();
    }
  } catch {
    // If native audio playback fails, trigger vibration fallback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // safe ignore
    }
  }
}

/**
 * Play a preview snippet of the chosen sound with haptics
 */
export async function previewSoundAudio(
  soundIdOrUri: string,
  volume = 80
): Promise<void> {
  try {
    stopAlarmAudio();

    // Trigger haptics
    if (volume > 60) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const source = resolveAudioSource(soundIdOrUri);
    if (!source) return;

    activePlayer = createAudioPlayer(source);
    if (activePlayer) {
      activePlayer.loop = false;
      if (typeof (activePlayer as any).setVolume === 'function') {
        (activePlayer as any).setVolume(Math.max(0.05, Math.min(1.0, volume / 100)));
      }
      activePlayer.play();

      // Automatically stop preview after 3.2 seconds
      previewTimeout = setTimeout(() => {
        stopAlarmAudio();
      }, 3200);
    }
  } catch {
    // safe fallback
  }
}

/**
 * Stop any running alarm or preview playback
 */
export function stopAlarmAudio(): void {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  if (activePlayer) {
    try {
      activePlayer.pause();
      if (typeof (activePlayer as any).remove === 'function') {
        (activePlayer as any).remove();
      }
    } catch {
      // safe ignore
    }
    activePlayer = null;
  }
}

/**
 * Launch system document picker for the user to choose custom audio from their device
 */
export async function pickSoundFromDevice(): Promise<SoundItem | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const cleanName = file.name
      ? file.name.replace(/\.[^/.]+$/, '').trim()
      : 'Imported Audio';

    const sizeKb = file.size ? Math.round(file.size / 1024) : 0;

    const newSoundItem: SoundItem = {
      id: `custom_${Date.now()}`,
      name: cleanName,
      description: `Device storage • ${sizeKb > 0 ? `${sizeKb} KB` : 'Custom Audio'}`,
      category: 'custom',
      uri: file.uri,
    };

    return newSoundItem;
  } catch {
    return null;
  }
}
