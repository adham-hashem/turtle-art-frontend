// Firebase App Compat 10.14.1
(function (global, factory) {
  // Universal Module Definition (UMD) pattern for compatibility with CommonJS, AMD, and browser environments
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('firebase/app'));
  } else if (typeof define === 'function' && define.amd) {
    define(['firebase/app'], factory);
  } else {
    global = typeof globalThis !== 'undefined' ? globalThis : global || self;
    global.firebase = factory(global.firebase || {});
  }
})(this, function (firebase) {
  'use strict';

  // Ensure firebase is the default export if it exists
  firebase = firebase && Object.prototype.hasOwnProperty.call(firebase, 'default') ? firebase.default : firebase;

  // Firebase SDK version
  const SDK_VERSION = '10.14.1';

  // Custom FirebaseError class for standardized error handling
  class FirebaseError extends Error {
    constructor(code, message, customData) {
      super(message);
      this.code = code;
      this.customData = customData;
      this.name = 'FirebaseError';
      this.__isFirebaseError = true;

      // Set prototype explicitly for proper inheritance
      Object.setPrototypeOf(this, FirebaseError.prototype);

      // Capture stack trace if available
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ErrorFactory.prototype.create);
      }
    }
  }

  // ErrorFactory for creating Firebase-specific errors
  class ErrorFactory {
    constructor(service, serviceName, errors) {
      this.service = service;
      this.serviceName = serviceName;
      this.errors = errors;
    }

    create(code, ...data) {
      const template = this.errors[code];
      const fullCode = `${this.service}/${code}`;
      const message = template
        ? template.replace(/\{\$([^}]+)}/g, (_, key) => {
            const value = data.shift();
            if (value == null) {
              throw new FirebaseError(`${fullCode}: Missing required argument "${key}"`);
            }
            return String(value);
          })
        : 'Error';
      const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
      const error = new FirebaseError(fullCode, fullMessage);
      if (this.service) {
        error.code = fullCode;
      }
      return error;
    }
  }

  // Mock user for testing or simulation purposes
  function createMockUser() {
    return {
      uid: 'mockUid',
      email: 'mock@example.com',
      getIdToken: () => Promise.resolve('mockIdToken'),
      getIdTokenResult: () => Promise.resolve({ token: 'mockIdToken' }),
      delete: () => Promise.resolve(),
      reload: () => Promise.resolve(),
      toJSON: () => ({
        uid: 'mockUid',
        email: 'mock@example.com',
        providerData: [],
        stsTokenManager: { accessToken: 'mockAccessToken' },
        metadata: { lastSignInTime: 'mockTime', creationTime: 'mockTime' },
      }),
    };
  }

  // Register Firebase components and version
  // Note: firebase_app and firebase_registerComponent/registerVersion are assumed to be defined elsewhere
  firebase_registerComponent(firebase_app);
  firebase_registerVersion(firebase_app, 'app', SDK_VERSION);

  return firebase_app;
});