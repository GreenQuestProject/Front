const path = require('path');

module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    browsers: ['ChromeHeadless'],
    reporters: ['progress', 'kjhtml', 'coverage'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    coverageReporter: {
      dir: path.join(__dirname, './coverage'),  // <-- lcov à la racine
      reporters: [
        { type: 'html', subdir: '.' },          // rapport HTML
        { type: 'lcovonly', subdir: '.' },      // <-- génère coverage/lcov.info
        { type: 'text-summary' }
      ]
    }
  });
};
