const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure Multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize Groq Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    console.log(`[SPEECH] Transcribing audio for user: ${req.user.userId}`);

    // Groq SDK requires a file stream, so we write the buffer to a temporary file
    const ext = path.extname(req.file.originalname) || '.m4a';
    tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Whisper uses ISO-639-1 language codes (e.g., 'kn' or 'en')
    const requestedLanguage = req.body.languageCode || 'kn-IN';
    const whisperLanguage = requestedLanguage.startsWith('en') ? 'en' : 'kn';

    const transcriptionResponse = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      language: whisperLanguage,
      response_format: "json",
      temperature: 0.0
    });

    const transcription = transcriptionResponse.text || "";

    console.log(`[SPEECH] Result: "${transcription}"`);

    res.json({ transcription });
  } catch (error) {
    console.error('[SPEECH ERROR]', error);
    res.status(500).json({ 
      message: 'Transcription failed: ' + error.message, 
      error: error.message,
      suggestion: 'Ensure GROQ_API_KEY is valid in .env'
    });
  } finally {
    // Clean up the temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('[SPEECH ERROR] Failed to clean up temp file:', cleanupError);
      }
    }
  }
});

module.exports = router;
