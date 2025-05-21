import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import formidable from 'formidable';

// Config for Vercel to parse multipart form data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 405, message: 'Method not allowed, use POST' });
  }

  // Parse incoming form data (audio file)
  const form = new formidable.IncomingForm({ multiples: false });
  const tmpDir = os.tmpdir();

  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!files.audio) {
      return res.status(400).json({ status: 400, message: 'No audio file uploaded as "audio"' });
    }

    const audioFile = files.audio;
    const tmpAudioPath = audioFile.filepath || audioFile.path;

    // Paths - adjust if needed based on your deployment
    const whisperPath = path.resolve('./build/bin/whisper-cli');
    const modelPath = path.resolve('./models/ggml-tiny.en-q5_1.bin');

    // Run whisper-cli
    const args = ['-m', modelPath, tmpAudioPath];

    const output = await new Promise((resolve, reject) => {
      execFile(whisperPath, args, (error, stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        resolve(stdout);
      });
    });

    // Process output to extract plain text (strip timestamps)
    const lines = output
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.replace(/\[[^\]]+\]\s*/, '').trim())
      .filter(Boolean);

    const plainText = lines.join(' ');
    const base64Text = Buffer.from(plainText, 'utf-8').toString('base64');

    // Clean up temp file
    await fs.unlink(tmpAudioPath).catch(() => {});

    // Respond with JSON
    return res.status(200).json({
      status: 200,
      response: base64Text,
    });
  } catch (err) {
    console.error('Transcription error:', err);
    return res.status(500).json({ status: 500, message: 'Transcription failed', error: err.message });
  }
}