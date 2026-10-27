import {
  parseTo12Hour,
  formatTo24Hour,
  formatDisplayTime,
} from '../../src/domain/time-format';

describe('Time Format Utility', () => {
  describe('parseTo12Hour', () => {
    it('converts morning 07:00 to 7 AM', () => {
      const res = parseTo12Hour('07:00');
      expect(res.hours).toBe(7);
      expect(res.minutes).toBe(0);
      expect(res.ampm).toBe('AM');
      expect(res.hoursString).toBe('07');
      expect(res.minutesString).toBe('00');
    });

    it('converts midnight 00:30 to 12:30 AM', () => {
      const res = parseTo12Hour('00:30');
      expect(res.hours).toBe(12);
      expect(res.minutes).toBe(30);
      expect(res.ampm).toBe('AM');
      expect(res.hoursString).toBe('12');
    });

    it('converts noon 12:00 to 12:00 PM', () => {
      const res = parseTo12Hour('12:00');
      expect(res.hours).toBe(12);
      expect(res.minutes).toBe(0);
      expect(res.ampm).toBe('PM');
    });

    it('converts evening 23:45 to 11:45 PM', () => {
      const res = parseTo12Hour('23:45');
      expect(res.hours).toBe(11);
      expect(res.minutes).toBe(45);
      expect(res.ampm).toBe('PM');
      expect(res.hoursString).toBe('11');
    });
  });

  describe('formatTo24Hour', () => {
    it('converts 7:00 AM to 07:00', () => {
      expect(formatTo24Hour(7, 0, 'AM')).toBe('07:00');
    });

    it('converts 12:00 AM to 00:00', () => {
      expect(formatTo24Hour(12, 0, 'AM')).toBe('00:00');
    });

    it('converts 12:30 PM to 12:30', () => {
      expect(formatTo24Hour(12, 30, 'PM')).toBe('12:30');
    });

    it('converts 11:45 PM to 23:45', () => {
      expect(formatTo24Hour(11, 45, 'PM')).toBe('23:45');
    });
  });

  describe('formatDisplayTime', () => {
    it('formats 12h with AM/PM', () => {
      const res = formatDisplayTime('19:30', '12h');
      expect(res.time).toBe('07:30');
      expect(res.ampm).toBe('PM');
      expect(res.formatted).toBe('07:30 PM');
    });

    it('formats 24h as canonical HH:mm', () => {
      const res = formatDisplayTime('19:30', '24h');
      expect(res.time).toBe('19:30');
      expect(res.ampm).toBeUndefined();
      expect(res.formatted).toBe('19:30');
    });
  });
});
