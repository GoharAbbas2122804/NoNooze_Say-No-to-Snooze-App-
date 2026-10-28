import * as Haptics from 'expo-haptics';

export interface SoundItem {
  id: string;
  name: string;
  description: string;
  category: 'gentle' | 'energetic' | 'rhythmic' | 'voice' | 'custom';
  isDefault?: boolean;
  asset?: any;
  uri?: string;
}

export const DEFAULT_SOUND_ASSETS: Record<string, any> = {
  melodian: require('../../assets/sounds/melodian.mp3'),
  radar_pulse: require('../../assets/sounds/radar_pulse.mp3'),
  cosmic_pulse: require('../../assets/sounds/cosmic_pulse.mp3'),
  nothing_chime: require('../../assets/sounds/nothing_chime.mp3'),
  wake_voice: require('../../assets/sounds/wake_voice.mp3'),
  gentle_voice: require('../../assets/sounds/gentle_voice.mp3'),
};

export const ALARM_SOUNDS: SoundItem[] = [
  {
    id: 'Melodian',
    name: 'Melodian',
    description: 'Calm harmonic synthesizer crescendo',
    category: 'gentle',
    isDefault: true,
    asset: DEFAULT_SOUND_ASSETS.melodian,
  },
  {
    id: 'Radiant Radar',
    name: 'Radiant Radar',
    description: 'Crisp periodic electronic pulses',
    category: 'energetic',
    asset: DEFAULT_SOUND_ASSETS.radar_pulse,
  },
  {
    id: 'Cosmic Pulse',
    name: 'Cosmic Pulse',
    description: 'Deep modular bass and cosmic harmonics',
    category: 'rhythmic',
    asset: DEFAULT_SOUND_ASSETS.cosmic_pulse,
  },
  {
    id: 'Nothing Chime',
    name: 'Nothing Chime',
    description: 'Acoustic bell strikes and minimal resonance',
    category: 'gentle',
    asset: DEFAULT_SOUND_ASSETS.nothing_chime,
  },
  {
    id: 'Voice Motivation',
    name: 'Voice Motivation',
    description: 'AI coach: "Good morning! Time to wake up and get moving!"',
    category: 'voice',
    asset: DEFAULT_SOUND_ASSETS.wake_voice,
  },
  {
    id: 'Voice Gentle',
    name: 'Voice Gentle',
    description: 'Calm guide: "Time to wake up gently. Open your eyes."',
    category: 'voice',
    asset: DEFAULT_SOUND_ASSETS.gentle_voice,
  },
  {
    id: 'Digital Synth',
    name: 'Digital Synth',
    description: 'Retro 8-bit morning wake pulse',
    category: 'energetic',
    asset: DEFAULT_SOUND_ASSETS.radar_pulse,
  },
  {
    id: 'Aurora Awakening',
    name: 'Aurora Awakening',
    description: 'Soft ambient chime and sunrise rise',
    category: 'gentle',
    asset: DEFAULT_SOUND_ASSETS.melodian,
  },
];

/**
 * Trigger audio preview feedback (haptic pattern + tactile feedback)
 */
export async function previewSoundFeedback(soundId: string, volume = 80): Promise<void> {
  try {
    if (volume > 60) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (volume > 25) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // safely ignore haptic failure
  }
}

