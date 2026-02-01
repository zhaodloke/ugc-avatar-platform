from openai import OpenAI
import requests
from app.core.config import settings
import logging
from typing import Optional
import struct

logger = logging.getLogger(__name__)


def generate_silent_wav(duration_seconds: float = 1.0, sample_rate: int = 22050) -> bytes:
    """Generate a silent WAV file as placeholder audio"""
    num_samples = int(sample_rate * duration_seconds)
    # WAV header
    wav_header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + num_samples * 2,  # file size - 8
        b'WAVE',
        b'fmt ',
        16,  # chunk size
        1,   # audio format (PCM)
        1,   # num channels
        sample_rate,
        sample_rate * 2,  # byte rate
        2,   # block align
        16,  # bits per sample
        b'data',
        num_samples * 2  # data size
    )
    # Silent audio data (zeros)
    audio_data = b'\x00\x00' * num_samples
    return wav_header + audio_data


class TTSService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.mock_mode = False

    def generate_audio(self, text: str, voice_id: str = "default", provider: str = "openai") -> bytes:
        """Generate audio from text using TTS"""

        # Try real TTS first, fall back to mock on failure
        try:
            if provider == "openai" and self.openai_client:
                return self._generate_openai_tts(text, voice_id)
            elif provider == "elevenlabs" and self.elevenlabs_api_key:
                return self._generate_elevenlabs_tts(text, voice_id)
        except Exception as e:
            logger.warning(f"TTS provider {provider} failed: {e}, using mock audio")
            print(f"[TTS] Provider {provider} failed: {e}, using mock audio")

        # Fall back to mock audio
        return self._generate_mock_audio(text)

    def _generate_openai_tts(self, text: str, voice: str = "alloy") -> bytes:
        """Generate audio using OpenAI TTS"""
        try:
            response = self.openai_client.audio.speech.create(
                model="tts-1-hd",
                voice=voice,  # alloy, echo, fable, onyx, nova, shimmer
                input=text
            )
            return response.content
        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            raise

    def _generate_elevenlabs_tts(self, text: str, voice_id: str) -> bytes:
        """Generate audio using ElevenLabs"""
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5
                }
            }

            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()

            return response.content
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}")
            raise

    def _generate_mock_audio(self, text: str) -> bytes:
        """Generate mock/placeholder audio for development"""
        # Estimate duration: ~150 words per minute, average 5 chars per word
        words = len(text.split())
        duration = max(1.0, words / 2.5)  # At least 1 second
        print(f"[TTS] Generating mock audio for {words} words, duration: {duration:.1f}s")
        return generate_silent_wav(duration_seconds=duration)


_tts_service: Optional["TTSService"] = None

def get_tts_service() -> "TTSService":
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service

