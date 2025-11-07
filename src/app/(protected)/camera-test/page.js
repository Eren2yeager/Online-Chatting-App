'use client';

import { useState } from 'react';

/**
 * Camera Debug Test Page
 * Use this to test camera access and debug permission issues
 */
export default function CameraTestPage() {
  const [logs, setLogs] = useState([]);
  const [videoStream, setVideoStream] = useState(null);
  const [permissionState, setPermissionState] = useState('unknown');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const checkPermissionAPI = async () => {
    addLog('=== Testing Permissions API ===', 'header');
    
    if (!navigator.permissions) {
      addLog('❌ Permissions API not supported', 'error');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      addLog(`✅ Permission state: ${result.state}`, 'success');
      setPermissionState(result.state);
      
      // Listen for changes
      result.addEventListener('change', () => {
        addLog(`🔄 Permission changed to: ${result.state}`, 'info');
        setPermissionState(result.state);
      });
    } catch (error) {
      addLog(`❌ Permissions API error: ${error.message}`, 'error');
    }
  };

  const checkMediaDevices = () => {
    addLog('=== Testing Media Devices API ===', 'header');
    
    if (!navigator.mediaDevices) {
      addLog('❌ MediaDevices API not supported', 'error');
      return;
    }
    
    addLog('✅ MediaDevices API supported', 'success');
    
    if (!navigator.mediaDevices.getUserMedia) {
      addLog('❌ getUserMedia not supported', 'error');
      return;
    }
    
    addLog('✅ getUserMedia supported', 'success');
  };

  const listCameras = async () => {
    addLog('=== Listing Available Cameras ===', 'header');
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        addLog('❌ No cameras found', 'error');
      } else {
        addLog(`✅ Found ${cameras.length} camera(s):`, 'success');
        cameras.forEach((camera, index) => {
          addLog(`  ${index + 1}. ${camera.label || 'Camera ' + (index + 1)} (${camera.deviceId})`, 'info');
        });
      }
    } catch (error) {
      addLog(`❌ Error listing cameras: ${error.message}`, 'error');
    }
  };

  const requestCamera = async () => {
    addLog('=== Requesting Camera Access ===', 'header');
    
    try {
      addLog('📹 Calling getUserMedia...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      addLog('✅ Camera access granted!', 'success');
      addLog(`Stream ID: ${stream.id}`, 'info');
      addLog(`Active tracks: ${stream.getVideoTracks().length}`, 'info');
      
      setVideoStream(stream);
      
      // Display video
      const videoElement = document.getElementById('test-video');
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (error) {
      addLog(`❌ Camera access failed: ${error.name}`, 'error');
      addLog(`   Message: ${error.message}`, 'error');
      
      if (error.name === 'NotAllowedError') {
        addLog('   → User denied permission or browser blocked access', 'error');
      } else if (error.name === 'NotFoundError') {
        addLog('   → No camera found on device', 'error');
      } else if (error.name === 'NotReadableError') {
        addLog('   → Camera is in use by another application', 'error');
      } else if (error.name === 'OverconstrainedError') {
        addLog('   → Camera constraints not satisfied', 'error');
      }
    }
  };

  const stopCamera = () => {
    addLog('=== Stopping Camera ===', 'header');
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.kind}`, 'info');
      });
      setVideoStream(null);
      
      const videoElement = document.getElementById('test-video');
      if (videoElement) {
        videoElement.srcObject = null;
      }
      
      addLog('✅ Camera stopped', 'success');
    } else {
      addLog('⚠️ No active camera stream', 'warning');
    }
  };

  const runAllTests = async () => {
    setLogs([]);
    addLog('🚀 Starting Camera Diagnostics...', 'header');
    addLog(`Browser: ${navigator.userAgent}`, 'info');
    addLog(`Protocol: ${window.location.protocol}`, 'info');
    addLog(`Host: ${window.location.host}`, 'info');
    addLog('', 'info');
    
    checkMediaDevices();
    addLog('', 'info');
    
    await checkPermissionAPI();
    addLog('', 'info');
    
    await listCameras();
    addLog('', 'info');
    
    addLog('✅ Diagnostics complete. Click "Request Camera" to test access.', 'success');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'header': return 'text-blue-600 font-bold text-lg';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📹 Camera Access Debug Tool
          </h1>
          <p className="text-gray-600 mb-6">
            Use this page to diagnose camera permission and access issues
          </p>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              🔍 Run Diagnostics
            </button>
            <button
              onClick={requestCamera}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              📹 Request Camera
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              disabled={!videoStream}
            >
              ⏹️ Stop Camera
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              🗑️ Clear Logs
            </button>
          </div>

          {/* Permission State */}
          {permissionState !== 'unknown' && (
            <div className={`p-4 rounded-lg mb-6 ${
              permissionState === 'granted' ? 'bg-green-50 border-2 border-green-200' :
              permissionState === 'denied' ? 'bg-red-50 border-2 border-red-200' :
              'bg-yellow-50 border-2 border-yellow-200'
            }`}>
              <p className="font-semibold">
                Current Permission State: <span className="text-lg">{permissionState.toUpperCase()}</span>
              </p>
            </div>
          )}

          {/* Video Preview */}
          {videoStream && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">📺 Live Camera Feed:</h2>
              <video
                id="test-video"
                autoPlay
                playsInline
                muted
                className="w-full max-w-2xl rounded-lg border-4 border-green-500"
              />
            </div>
          )}

          {/* Logs */}
          <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h2 className="text-white font-bold mb-3">📋 Console Logs:</h2>
            {logs.length === 0 ? (
              <p className="text-gray-400 italic">No logs yet. Click "Run Diagnostics" to start.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className={getLogColor(log.type)}>
                    {log.type !== 'header' && (
                      <span className="text-gray-500">[{log.timestamp}] </span>
                    )}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">📖 Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Click "Run Diagnostics" to check browser support and permission status</li>
              <li>Click "Request Camera" to trigger the browser permission dialog</li>
              <li>If you see the camera feed, everything is working!</li>
              <li>If you get errors, check the logs for details</li>
              <li>Make sure you're using HTTPS (or localhost)</li>
              <li>Check browser settings: Site Settings → Camera</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
