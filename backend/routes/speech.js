const express = require('express');
const multer = require('multer');
const speech = require('@google-cloud/speech');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure Multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize Google Cloud Speech Client
// This will automatically look for GOOGLE_APPLICATION_CREDENTIALS in .env
const client = new speech.SpeechClient();

router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    console.log(`[SPEECH] Transcribing audio for user: ${req.user.userId}`);

    const audioBytes = req.file.buffer.toString('base64');

    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: 'WEBM_OPUS', // Default for most modern mobile recordings, will adjust if needed
      sampleRateHertz: 48000, 
      languageCode: 'kn-IN', // Kannada (India)
      enableAutomaticPunctuation: true,
      model: 'default'
    };

    // Google Cloud supports various encodings. 
    // If WEBM_OPUS fails, we can try OGG_OPUS or MP3 depending on the device.
    const request = {
      audio: audio,
      config: config,
    };

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log(`[SPEECH] Result: "${transcription}"`);

    res.json({ transcription });
  } catch (error) {
    console.error('[SPEECH ERROR]', error);
    res.status(500).json({ 
      message: 'Transcription failed', 
      error: error.message,
      suggestion: 'Ensure google-credentials.json is present in the backend folder and GOOGLE_APPLICATION_CREDENTIALS is set in .env'
    });
  }
});

module.exports = router;
