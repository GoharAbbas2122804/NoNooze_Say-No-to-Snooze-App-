# NoNooze Android Physical Device Test Checklist (Week 1)

This checklist provides the verification procedures for validating native Android alarm reliability, lockscreen intent, audio stream routing, and watchdog recovery on a physical Android device.

Package: `com.nonooze.app`  
Alarm Channel: `nonooze_alarms`  
Audio Stream: `STREAM_ALARM` (`AudioAttributes.USAGE_ALARM`)

---

## Device Test Matrix

| # | Test Scenario | Verification Command (ADB / System) | Expected Result | Status |
|---|---------------|--------------------------------------|-----------------|--------|
| **1** | **Screen Off Wakeup** | 1. Set alarm for 2 mins ahead in app.<br>2. Turn screen off (`adb shell input keyevent 26`).<br>3. Check alarm queue: `adb shell dumpsys alarm \| grep -E "com.nonooze.app\|nonooze"` | Screen turns on at exact minute, lock screen displays Ringing Screen with Math challenge. | ⏳ Manual / Phone |
| **2** | **App Swiped Away from Recents** | 1. Set alarm.<br>2. Swipe app away from Android Recents screen.<br>3. Verify alarm still registered: `adb shell dumpsys alarm \| grep com.nonooze.app` | Alarm fires at exact minute with foreground service audio. | ⏳ Manual / Phone |
| **3** | **Watchdog Re-ring on Force Kill** | 1. While alarm is ringing, force stop app: `adb shell am force-stop com.nonooze.app`<br>2. Wait 60 seconds.<br>3. Monitor logcat: `adb logcat -s notifee` | Alarm re-rings within 60 seconds via watchdog AlarmClock failsafe. | ⏳ Manual / Phone |
| **4** | **Device Reboot Recovery** | 1. Set repeating alarm.<br>2. Reboot phone (`adb reboot`).<br>3. After boot completes, check: `adb shell dumpsys alarm \| grep com.nonooze.app` | `BOOT_COMPLETED` receiver automatically reschedules all active alarms. | ⏳ Manual / Phone |
| **5** | **Overnight Doze (Deep Sleep)** | 1. Set alarm for 5 mins ahead.<br>2. Force device into deep Doze mode:<br>`adb shell dumpsys battery unplug`<br>`adb shell dumpsys deviceidle force-idle` | AlarmClock triggers immediately at exact minute, waking device from Doze. | ⏳ Manual / Phone |
| **6** | **Battery Saver Mode** | 1. Enable Android Battery Saver:<br>`adb shell settings put global low_power 1`<br>2. Set alarm for 2 mins ahead and turn screen off. | Exact AlarmClock fires without being deferred by power saver. | ⏳ Manual / Phone |
| **7** | **Do Not Disturb (DND) Bypass** | 1. Enable DND Priority Only or Total Silence.<br>2. Ensure notification channel has `bypassDnd=true`.<br>3. Trigger alarm. | Alarm audio plays at full volume on `STREAM_ALARM` despite DND active. | ⏳ Manual / Phone |
| **8** | **Media Volume 0 vs Alarm Volume 100%** | 1. Set media volume to 0 (`adb shell media volume --stream 3 --set 0`).<br>2. Set alarm volume to 100% (`adb shell media volume --stream 4 --set 15`).<br>3. Let alarm ring. | Alarm plays loud audio because audio stream is `STREAM_ALARM`, ignoring muted media. | ⏳ Manual / Phone |
| **9** | **Permission Revoked Mid-Day** | 1. Revoke exact alarm permission:<br>`adb shell appops set com.nonooze.app SCHEDULE_EXACT_ALARM deny`<br>2. Open app. | Permissions card highlights "Required", deep links user directly to system settings. | ⏳ Manual / Phone |
| **10** | **Timezone / Clock Change** | 1. Set alarm for 07:00.<br>2. Change system time forward 2 hours (`adb shell date ...`).<br>3. Verify next trigger date in app. | Next trigger recalculated to next occurrence without skipping or firing prematurely. | ⏳ Manual / Phone |
| **11** | **Multi-Step Dismissal Flow** | 1. Create alarm with 2 steps: Math (3 problems) + Math (2 problems).<br>2. Solve first 3 problems.<br>3. Verify transition to step 2.<br>4. Solve 2 problems. | Step runner advances 1/2 -> 2/2, transitions to `/success`, and silences audio. | ⏳ Manual / Phone |
| **12** | **OEM Battery Manager (Xiaomi/Vivo/Samsung)** | 1. Open device Settings > Apps > NoNooze.<br>2. Enable "Autostart".<br>3. Set Battery Usage to "Unrestricted / No restrictions". | Prevents aggressive OEM task killers from killing the alarm background service. | ⏳ Manual / Phone |

---

## Helpful ADB Debugging Commands

```bash
# Check all alarms registered for NoNooze package:
adb shell dumpsys alarm | grep -A 5 -B 2 "com.nonooze.app"

# Check battery optimization status (whitelisted = exempted):
adb shell dumpsys deviceidle whitelist | grep com.nonooze.app

# Simulate device entering deep idle / Doze:
adb shell dumpsys battery unplug
adb shell dumpsys deviceidle step
adb shell dumpsys deviceidle force-idle

# Reset battery state after testing:
adb shell dumpsys battery reset

# View Notifee and Alarm logcat output:
adb logcat -s notifee:V ReactNativeJS:V
```
