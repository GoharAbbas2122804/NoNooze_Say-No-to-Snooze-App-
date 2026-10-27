const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLockScreen(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication?.activity) {
      const mainActivity = mainApplication.activity.find(
        (activity) => activity.$['android:name'] === '.MainActivity'
      );
      if (mainActivity) {
        mainActivity.$['android:showWhenLocked'] = 'true';
        mainActivity.$['android:turnScreenOn'] = 'true';
        mainActivity.$['android:showForAllUsers'] = 'true';
      }
    }
    return config;
  });
};
