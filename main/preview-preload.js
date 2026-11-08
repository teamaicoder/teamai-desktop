'use strict';

// Preload for preview pages (persist:preview session).
//
// Electron has no passkey / platform-authenticator UI, so a WebAuthn request
// never completes. Microsoft and Google sign-in detect WebAuthn and offer a
// passkey first, which leaves the user stuck. Hiding WebAuthn before any page
// script runs makes those sites fall straight back to password and
// authenticator-app sign-in.

const { contextBridge } = require('electron');

contextBridge.executeInMainWorld({
  func: () => {
    try { delete window.PublicKeyCredential; } catch {}
    if (navigator.credentials) {
      const blocked = () => Promise.reject(new DOMException('Passkeys are not supported in this browser.', 'NotAllowedError'));
      const original = {
        get: navigator.credentials.get.bind(navigator.credentials),
        create: navigator.credentials.create.bind(navigator.credentials),
      };
      navigator.credentials.get = options => (options && options.publicKey ? blocked() : original.get(options));
      navigator.credentials.create = options => (options && options.publicKey ? blocked() : original.create(options));
    }
  },
});
