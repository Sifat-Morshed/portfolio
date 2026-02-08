import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, Pause, RotateCcw, FileAudio, AlertCircle } from 'lucide-react';
import { AUDIO_SCRIPT } from '../../src/lib/work/types';

interface AudioUploaderProps {
  onFileSelected: (file: File | null) => void;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3', 'audio/x-wav'];
const MAX_SIZE_MB = 5;
const MIN_DURATION = 30;
const MAX_DURATION = 60;

const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback(
    async (selectedFile: File) => {
      setError('');

      // Check type
      if (!ACCEPTED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a)$/i)) {
        setError('Only MP3, WAV, and M4A files are accepted.');
        return;
      }

      // Check size
      if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File must be under ${MAX_SIZE_MB}MB. Yours is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB.`);
        return;
      }

      // Check duration
      const url = URL.createObjectURL(selectedFile);
      const audio = new Audio(url);

      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration);
        setDuration(dur);

        if (dur < MIN_DURATION) {
          setError(`Recording must be at least ${MIN_DURATION} seconds. Yours is ${dur}s.`);
          URL.revokeObjectURL(url);
          return;
        }
        if (dur > MAX_DURATION) {
          setError(`Recording must be under ${MAX_DURATION} seconds. Yours is ${dur}s.`);
          URL.revokeObjectURL(url);
          return;
        }

        // Valid
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        setFile(selectedFile);
        onFileSelected(selectedFile);
      };

      audio.onerror = () => {
        setError('Unable to read audio file. Please try a different format.');
        URL.revokeObjectURL(url);
      };
    },
    [onFileSelected]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setFile(null);
    setDuration(0);
    setIsPlaying(false);
    setError('');
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Script to read */}
      <div className="p-px rounded-xl bg-gradient-to-b from-indigo-500/20 to-transparent">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">
            Recording Instructions (30–60 seconds total):
          </p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs font-bold text-primary mb-1">Part 1 — About You (first ~30 seconds)</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Speak naturally about yourself — your name, where you're from, any relevant experience you have, and why you're interested in this role.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-400 mb-1">Part 2 — Cold-Call Roleplay (next 15–30 seconds)</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-2">
                <strong className="text-white">Scenario:</strong> You are calling a senior IT director named <strong className="text-white">Mr. David Chen</strong>. He is busy and skeptical. Introduce Silverlight Research, explain you're conducting a short industry survey (not selling anything), and convince him to stay on the line.
              </p>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/60 mb-2">Sample Script</p>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "Hi, good afternoon — may I speak with Mr. David Chen please? … Hi Mr. Chen, my name is <span className="text-white not-italic">[Your Name]</span>, calling from Silverlight Research. I know you're busy so I'll be very brief — we're conducting a short 2-minute industry survey on IT infrastructure trends. This isn't a sales call at all, just gathering insights from senior directors like yourself. Would you have just a couple of minutes to share your perspective?"
                </p>
                <p className="text-xs text-slate-500 mt-2">If he pushes back, stay calm: <span className="italic text-slate-400">"I completely understand, Mr. Chen. It's genuinely just 2 minutes — your input helps shape our research report that goes out to 500+ companies."</span></p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Tip: Be natural, confident, and don't rush. Total recording: 30–60 seconds.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-surface'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={24} className="text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-1">
            Drag & drop your audio file, or <span className="text-primary font-medium">browse</span>
          </p>
          <p className="text-xs text-slate-500">
            MP3, WAV, or M4A · 30–60 seconds · Max {MAX_SIZE_MB}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-surface border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileAudio size={18} className="text-primary" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm text-white font-medium truncate">{file.name}</p>
              <p className="text-xs text-slate-500">
                {formatTime(duration)} · {(file.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors text-sm"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
