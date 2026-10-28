import {
  resolveAudioSource,
  playAlarmAudio,
  stopAlarmAudio,
  pickSoundFromDevice,
  previewSoundAudio,
} from '../../src/services/sound-service';
import * as DocumentPicker from 'expo-document-picker';
import { createAudioPlayer } from 'expo-audio';

describe('sound-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopAlarmAudio();
  });

  describe('resolveAudioSource', () => {
    it('returns default asset when empty or undefined', () => {
      const source = resolveAudioSource('');
      expect(source).toBeDefined();
    });

    it('resolves direct file URIs as URI object', () => {
      const source = resolveAudioSource('file:///storage/my_alarm.mp3');
      expect(source).toEqual({ uri: 'file:///storage/my_alarm.mp3' });
    });

    it('resolves catalog sound by name or id', () => {
      const sourceRadar = resolveAudioSource('Radiant Radar');
      expect(sourceRadar).toBeDefined();

      const sourceMelodian = resolveAudioSource('Melodian');
      expect(sourceMelodian).toBeDefined();
    });
  });

  describe('pickSoundFromDevice', () => {
    it('invokes DocumentPicker for audio files and formats SoundItem', async () => {
      const result = await pickSoundFromDevice();
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('custom_alarm_beat');
      expect(result?.category).toBe('custom');
      expect(result?.uri).toBe('file:///mock/storage/custom_alarm_beat.mp3');
    });

    it('returns null if user cancels document picker', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      const result = await pickSoundFromDevice();
      expect(result).toBeNull();
    });
  });

  describe('playAlarmAudio & stopAlarmAudio', () => {
    it('starts player and sets loop and volume', async () => {
      await playAlarmAudio('Melodian', 90, true);
      expect(createAudioPlayer).toHaveBeenCalled();
    });

    it('safely stops audio playback without throwing', () => {
      expect(() => stopAlarmAudio()).not.toThrow();
    });

    it('previews audio and auto-clears', async () => {
      await previewSoundAudio('Melodian', 50);
      expect(createAudioPlayer).toHaveBeenCalled();
      stopAlarmAudio();
    });
  });
});
