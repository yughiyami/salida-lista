const { withGradleProperties } = require('expo/config-plugins');

// Expo 58 otherwise permits 1024-character CMake object paths. SDK CMake
// 3.22.1 ships Ninja 1.10.2 here, which still fails on Windows long paths.
// Keep CNG reproducible, select modern Ninja, and hash long object paths.
// A 240 limit alone does not fix every nested autolinked codegen target.
module.exports = function withCmakeObjectPathLimit(config) {
  return withGradleProperties(config, (config) => {
    const properties = {
      'expo.android.cmakeObjectPathMax': '240',
      'android.cmakeVersion': '3.31.6',
    };
    config.modResults = config.modResults.filter(
      (entry) => entry.type !== 'property' || !(entry.key in properties),
    );
    for (const [key, value] of Object.entries(properties)) {
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });
};
