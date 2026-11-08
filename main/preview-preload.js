'use strict';

// Preload for preview pages (persist:preview session).
//
// Electron has no passkey / platform-authenticator UI, so a WebAuthn request
// never completes. Microsoft and Google sign-in detect WebAuthn and offer a
// passkey first, which leaves the user stuck. Hiding WebAuthn before any page
// script runs makes those sites fall straight back to password and
// authenticator-app sign-in.

//
// Google's sign-in also refuses embedded Chromium by reading navigator
// properties, so on its sign-in host the page sees Firefox's values. This
// string matches SIGN_IN_FIREFOX_UA in main/handlers.js (the sandboxed preload
// can't require it); a unit test keeps the two in step.

const { contextBridge } = require('electron');

const SIGN_IN_FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0';
const FIREFOX_SIGN_IN_HOSTS = ['accounts.google.com'];

contextBridge.executeInMainWorld({
  args: [SIGN_IN_FIREFOX_UA, FIREFOX_SIGN_IN_HOSTS],
  func: (firefoxUa, firefoxHosts) => {
    if (firefoxHosts.includes(location.hostname)) {
      const props = {
        userAgent: firefoxUa,
        appVersion: '5.0 (Macintosh)',
        vendor: '',
        userAgentData: undefined,
      };
      for (const [name, value] of Object.entries(props)) {
        try { Object.defineProperty(Navigator.prototype, name, { get: () => value, configurable: true }); } catch {}
      }
    }
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
