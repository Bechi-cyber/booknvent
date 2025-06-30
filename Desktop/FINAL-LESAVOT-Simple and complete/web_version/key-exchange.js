// key-exchange.js
// ECDH key exchange integration for LESAVOT frontend (P-256, HKDF)
// Requires: modern browser with Web Crypto API and fetch

export class DiffieHellmanKeyExchange {
  constructor(apiBase = '/api/v1/key-exchange') {
    this.apiBase = apiBase;
    this.serverPublicKey = null;
    this.clientKeyPair = null;
    this.derivedKey = null;
  }

  // Step 1: Fetch server ECDH public key
  async fetchServerParams() {
    const res = await fetch(this.apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.status !== 'success') throw new Error('Failed to fetch server ECDH public key');
    this.serverPublicKey = data.serverPublicKey;
    return data;
  }

  // Step 2: Generate client ECDH key pair (P-256)
  async generateClientKeyPair() {
    this.clientKeyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    return this.clientKeyPair;
  }

  // Step 3: Export client public key (base64)
  async exportClientPublicKey() {
    if (!this.clientKeyPair) throw new Error('Client key pair not generated');
    const raw = await window.crypto.subtle.exportKey('raw', this.clientKeyPair.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(raw)));
  }

  // Step 4: Import server public key
  async importServerPublicKey() {
    if (!this.serverPublicKey) throw new Error('Server public key not loaded');
    const raw = Uint8Array.from(atob(this.serverPublicKey), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
  }

  // Step 5: Compute shared secret and derive key (HKDF-SHA256)
  async computeAndDeriveKey() {
    const serverPubKey = await this.importServerPublicKey();
    const sharedSecret = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: serverPubKey
      },
      this.clientKeyPair.privateKey,
      256
    );
    // Derive a key using HKDF (SHA-256, no salt for demo)
    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const derivedKeyBuffer = await window.crypto.subtle.sign('HMAC', hkdfKey, new Uint8Array([]));
    this.derivedKey = btoa(String.fromCharCode(...new Uint8Array(derivedKeyBuffer)));
    return this.derivedKey;
  }

  // Step 6: Send client public key to server and get server's derived key
  async completeKeyExchange() {
    const clientPublicKey = await this.exportClientPublicKey();
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientPublicKey })
    });
    const data = await res.json();
    if (data.status !== 'success') throw new Error('Key exchange failed');
    // Optionally verify that both sides have the same derived key
    this.serverDerivedKey = data.derivedKey;
    return data.derivedKey;
  }
}

// Usage example (in your app):
// import { DiffieHellmanKeyExchange } from './key-exchange.js';
// const dh = new DiffieHellmanKeyExchange();
// await dh.fetchServerParams();
// await dh.generateClientKeyPair();
// await dh.computeAndDeriveKey();
// await dh.completeKeyExchange();
// console.log('Derived key (client):', dh.derivedKey);
// console.log('Derived key (server):', dh.serverDerivedKey);
