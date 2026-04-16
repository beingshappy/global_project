const { spawn } = require('child_process');
const path = require('path');

// Store running AI processes keyed by cameraId
const activeCameras = {}; 

exports.toggleAI = async (req, res) => {
  // cameraId: string (e.g., 'CAM-1'), source: string (e.g., '0' or 'rtsp://...')
  const { action, cameraId, source } = req.body; 

  try {
    if (action === 'start') {
      if (!cameraId || !source) {
        return res.status(400).json({ msg: 'cameraId and source are required to start.' });
      }

      if (activeCameras[cameraId]) {
        return res.json({ msg: `Camera ${cameraId} is already running.`, status: 'ONLINE' });
      }

      console.log(`🚀 Booting AI Engine for ${cameraId}...`);
      const aiModulePath = path.resolve(__dirname, '../../ai-module');
      
      // Retrieve Python path from environment variable
      const pythonPath = process.env.PYTHON_PATH || 'python';
      
      if (!process.env.PYTHON_PATH) {
        console.warn('⚠️ PYTHON_PATH not found in .env. Falling back to global "python" command.');
      }
      
      // Fetch Config for the flags
      const Config = require('../models/Config');
      let config = await Config.findOne();
      if (!config) config = { confidence: 75, deepFace: true, lowLight: true };

      const flags = [
        'main.py',
        '--camera_id', cameraId,
        '--source', source,
        '--confidence', (config.confidence / 100).toString(),
        '--deepface', config.deepFace ? 'true' : 'false',
        '--lowlight', config.lowLight ? 'true' : 'false'
      ];

      const aiProcess = spawn(pythonPath, flags, {
        cwd: aiModulePath,
        shell: true
      });

      aiProcess.stdout.on('data', (data) => {
        console.log(`[${cameraId}]: ${data}`);
      });

      aiProcess.stderr.on('data', (data) => {
        console.error(`[${cameraId} ERROR]: ${data}`);
      });

      aiProcess.on('error', (err) => {
        console.error(`❌ Failed to start AI process for ${cameraId}:`, err);
      });

      aiProcess.on('close', (code) => {
        console.log(`[${cameraId}] Process exited with code ${code}`);
        delete activeCameras[cameraId];
      });

      activeCameras[cameraId] = { process: aiProcess, source };
      return res.json({ msg: `${cameraId} booted successfully.`, status: 'ONLINE' });
    }

    if (action === 'stop') {
      if (!cameraId) {
         return res.status(400).json({ msg: 'cameraId required to stop.' });
      }

      if (!activeCameras[cameraId]) {
        return res.json({ msg: `${cameraId} is already offline.`, status: 'OFFLINE' });
      }

      console.log(`🛑 Shutting down AI Engine for ${cameraId}...`);
      const camProc = activeCameras[cameraId].process;
      
      // Windows needs taskkill to properly terminate child processes
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${camProc.pid} /T /F`, (err) => {
          if (err) console.error('taskkill error:', err.message);
        });
      } else {
        camProc.kill('SIGTERM');
      }
      
      delete activeCameras[cameraId];
      return res.json({ msg: `${cameraId} shutdown successful.`, status: 'OFFLINE' });
    }

    return res.status(400).json({ msg: 'Invalid action provided.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error while communicating with AI Engine.');
  }
};

exports.getStatus = (req, res) => {
  // Return the status of all active cameras
  const statusObj = {};
  for (const cam in activeCameras) {
    statusObj[cam] = 'ONLINE';
  }
  res.json({ activeCameras: statusObj });
};
