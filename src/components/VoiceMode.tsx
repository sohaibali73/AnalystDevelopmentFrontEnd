'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  lastAssistantText: string;
  isStreaming: boolean;
  getAuthToken: () => string;
}

export function VoiceMode({ isOpen, onClose, onSendMessage, lastAssistantText, isStreaming, getAuthToken }: VoiceModeProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [displayText, setDisplayText] = useState('Tap to start talking');
  const [orbScale, setOrbScale] = useState(1);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);

  // Start speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDisplayText('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('listening');
      setDisplayText('Listening...');
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      
      const current = final || interim;
      setTranscript(prev => final ? prev + final : prev);
      setDisplayText(current || 'Listening...');
      setOrbScale(1 + Math.min(current.length / 50, 0.5));

      // Reset silence timer — auto-send after 1.5s of silence
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (final) {
        silenceTimerRef.current = setTimeout(() => {
          const fullTranscript = (transcript + final).trim();
          if (fullTranscript && isActiveRef.current) {
            recognition.stop();
            setVoiceState('processing');
            setDisplayText(fullTranscript);
            onSendMessage(fullTranscript);
            setTranscript('');
          }
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
        setDisplayText(`Error: ${event.error}`);
      }
      if (isActiveRef.current && event.error === 'no-speech') {
        // Restart on no-speech
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      // Auto-restart if we're still in voice mode and not processing
      if (isActiveRef.current && voiceState === 'listening') {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [onSendMessage, transcript, voiceState]);

  // Stop everything
  const stopAll = useCallback(() => {
    isActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
    setDisplayText('Tap to start talking');
    setOrbScale(1);
  }, []);

  // Play TTS and then resume listening
  const speakAndResume = useCallback(async (text: string) => {
    if (!text.trim() || text === lastSpokenRef.current || !isActiveRef.current) return;
    lastSpokenRef.current = text;

    setVoiceState('speaking');
    setDisplayText(text.length > 150 ? text.substring(0, 150) + '...' : text);

    try {
      const token = getAuthToken();
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ text: text.substring(0, 3000), voice: 'en-US-AriaNeural' }),
      });

      if (!resp.ok) {
        // TTS failed, just resume listening
        if (isActiveRef.current) startListening();
        return;
      }

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) { audioRef.current.pause(); }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Animate orb while speaking
      let animFrame: number;
      const analyzeAudio = () => {
        setOrbScale(1 + Math.random() * 0.3);
        if (audioRef.current && !audioRef.current.paused) {
          animFrame = requestAnimationFrame(analyzeAudio);
        }
      };

      audio.onplay = () => { analyzeAudio(); };
      audio.onended = () => {
        cancelAnimationFrame(animFrame);
        setOrbScale(1);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        // Resume listening after speaking
        if (isActiveRef.current) {
          startListening();
        }
      };
      audio.onerror = () => {
        cancelAnimationFrame(animFrame);
        setOrbScale(1);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        if (isActiveRef.current) startListening();
      };

      audio.play().catch(() => {
        if (isActiveRef.current) startListening();
      });
    } catch {
      if (isActiveRef.current) startListening();
    }
  }, [getAuthToken, startListening]);

  // Watch for assistant responses to auto-speak
  useEffect(() => {
    if (!isOpen || !isActiveRef.current) return;
    if (voiceState === 'processing' && !isStreaming && lastAssistantText && lastAssistantText !== lastSpokenRef.current) {
      speakAndResume(lastAssistantText);
    }
  }, [isOpen, isStreaming, lastAssistantText, voiceState, speakAndResume]);

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      isActiveRef.current = true;
      lastSpokenRef.current = '';
    } else {
      stopAll();
    }
    return () => { stopAll(); };
  }, [isOpen, stopAll]);

  // Handle orb click
  const handleOrbClick = () => {
    if (voiceState === 'idle') {
      isActiveRef.current = true;
      startListening();
    } else if (voiceState === 'listening') {
      // Force send current transcript
      const text = transcript.trim();
      if (text) {
        if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
        setVoiceState('processing');
        setDisplayText(text);
        onSendMessage(text);
        setTranscript('');
      }
    } else if (voiceState === 'speaking') {
      // Stop speaking, resume listening
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      startListening();
    }
  };

  if (!isOpen) return null;

  const orbColors = {
    idle: 'rgba(254, 192, 15, 0.3)',
    listening: 'rgba(34, 197, 94, 0.4)',
    processing: 'rgba(59, 130, 246, 0.4)',
    speaking: 'rgba(168, 85, 247, 0.4)',
  };

  const orbBorderColors = {
    idle: '#FEC00F',
    listening: '#22c55e',
    processing: '#3b82f6',
    speaking: '#a855f7',
  };

  const stateLabels = {
    idle: 'Tap to start',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: '24px', right: '24px',
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: '48px', height: '48px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <X size={24} color="#fff" />
      </button>

      {/* State label */}
      <div style={{ color: orbBorderColors[voiceState], fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px' }}>
        {stateLabels[voiceState]}
      </div>

      {/* Animated Orb */}
      <div onClick={handleOrbClick} style={{
        width: '200px', height: '200px', borderRadius: '50%', cursor: 'pointer',
        background: `radial-gradient(circle, ${orbColors[voiceState]} 0%, transparent 70%)`,
        border: `3px solid ${orbBorderColors[voiceState]}`,
        boxShadow: `0 0 ${40 * orbScale}px ${orbBorderColors[voiceState]}40, 0 0 ${80 * orbScale}px ${orbBorderColors[voiceState]}20`,
        transform: `scale(${orbScale})`,
        transition: 'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {voiceState === 'idle' && <Mic size={48} color={orbBorderColors[voiceState]} />}
        {voiceState === 'listening' && <Mic size={48} color={orbBorderColors[voiceState]} style={{ animation: 'pulse 1.5s infinite' }} />}
        {voiceState === 'processing' && <Loader2 size={48} color={orbBorderColors[voiceState]} style={{ animation: 'spin 1s linear infinite' }} />}
        {voiceState === 'speaking' && <Volume2 size={48} color={orbBorderColors[voiceState]} style={{ animation: 'pulse 0.8s infinite' }} />}
      </div>

      {/* Transcript / Display Text */}
      <div style={{
        marginTop: '40px', maxWidth: '500px', textAlign: 'center',
        color: '#fff', fontSize: '18px', lineHeight: 1.6, fontWeight: 300,
        minHeight: '60px', padding: '0 24px',
      }}>
        {displayText}
      </div>

      {/* Hint */}
      <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
        {voiceState === 'listening' ? 'Speak naturally — sends automatically after pause' :
         voiceState === 'speaking' ? 'Tap orb to interrupt' :
         voiceState === 'processing' ? 'Waiting for response...' :
         'Tap the orb to begin a voice conversation'}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default VoiceMode;
