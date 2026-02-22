// Jest setup file for testing environment configuration
require('@testing-library/jest-dom');

// Mock browser APIs that may not be available in jsdom
global.MediaStream = class MediaStream {
  constructor() {
    this.id = Math.random().toString(36);
    this.active = true;
    this.tracks = [];
  }
  
  getTracks() {
    return this.tracks;
  }
  
  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }
  
  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video');
  }
  
  addTrack(track) {
    this.tracks.push(track);
  }
  
  removeTrack(track) {
    this.tracks = this.tracks.filter(t => t !== track);
  }
};

global.MediaStreamTrack = class MediaStreamTrack {
  constructor(kind = 'video') {
    this.kind = kind;
    this.id = Math.random().toString(36);
    this.label = `${kind} track`;
    this.enabled = true;
    this.readyState = 'live';
  }
  
  stop() {
    this.readyState = 'ended';
  }
};

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
    enumerateDevices: jest.fn(),
  },
});

// Mock navigator.permissions
Object.defineProperty(global.navigator, 'permissions', {
  writable: true,
  value: {
    query: jest.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Suppress specific error types in console during tests
// This prevents Jest from treating expected errors as test failures
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Suppress NotAllowedError and NotFoundError which are expected in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('NotAllowedError') || args[0].includes('NotFoundError'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
