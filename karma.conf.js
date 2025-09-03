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
      dir: path.join(__dirname, './coverage'),
      reporters: [
        {type: 'html', subdir: '.'},
        {type: 'lcovonly', subdir: '.'},
        {type: 'text-summary'}
      ]
    }
  });
};
