'use client';

/**
 * useTTS — Text-to-speech hook using backend edge-tts.
 *
 * Extracted from ChatPage.tsx to encapsulate TTS lifecycle:
 * - Play text as speech via /api/tts
 * - Stop playback
 * - Track speaking state
 * - Prevent duplicate speech for the same message
 */

import { useState, useRef, useCallback } from 'react';
import { getAuthToken } from '@/components/chat/chat-utils';

interface UseTTSOptions {
  voice?: string;
}

export function useTTS({ voice = 'en-US-AriaNeural' }: UseTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMsgId = useRef<string | null>(null);

  const speakText = useCallback(
    async (text: string, messageId: string) => {
      if (!text.trim() || lastSpokenMsgId.current === messageId) return;
      lastSpokenMsgId.current = messageId;

      try {
        setIsSpeaking(true);
        const token = getAuthToken();
        const resp = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ text, voice }),
        });

        if (!resp.ok) {
          setIsSpeaking(false);
          return;
        }

        const audioBlob = await resp.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const cleanup = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onended = cleanup;
        audio.onerror = cleanup;
        audio.play().catch(() => setIsSpeaking(false));
      } catch {
        setIsSpeaking(false);
      }
    },
    [voice],
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speakText, stopSpeaking };
}
