"""
Audio format converter for converting WebM to WAV format for Azure Speech Service.
"""
import io
import wave
from typing import Optional
from pydub import AudioSegment
from app.core.logging import get_logger

logger = get_logger(__name__)


def convert_webm_to_wav(audio_data: bytes, sample_rate: int = 16000, channels: int = 1) -> bytes:
    """
    Convert WebM audio to WAV format (PCM) for Azure Speech Service.
    
    Args:
        audio_data: WebM audio bytes
        sample_rate: Target sample rate (default: 16000 Hz for Azure Speech)
        channels: Number of channels (default: 1 for mono)
        
    Returns:
        WAV audio bytes (PCM format)
    """
    try:
        # Load WebM audio using pydub
        # pydub uses ffmpeg under the hood for WebM support
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
        
        logger.info(f"Loaded audio: {audio.frame_rate}Hz, {audio.channels} channels, {len(audio)}ms")
        
        # Convert to mono if needed
        if audio.channels != channels:
            audio = audio.set_channels(channels)
            logger.info(f"Converted to {channels} channel(s)")
        
        # Resample to target sample rate
        if audio.frame_rate != sample_rate:
            audio = audio.set_frame_rate(sample_rate)
            logger.info(f"Resampled to {sample_rate}Hz")
        
        # Convert to WAV format (PCM)
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)
        
        wav_data = wav_buffer.read()
        logger.info(f"Converted to WAV: {len(wav_data)} bytes")
        
        return wav_data
        
    except Exception as e:
        logger.error(f"Error converting WebM to WAV: {e}", exc_info=True)
        # If pydub fails (e.g., ffmpeg not available), try alternative approach
        raise


def convert_to_pcm_wav(audio_data: bytes, input_format: str = "webm", sample_rate: int = 16000, channels: int = 1) -> bytes:
    """
    Convert any audio format to PCM WAV format.
    
    Args:
        audio_data: Audio bytes
        input_format: Input format (webm, mp3, etc.)
        sample_rate: Target sample rate (default: 16000 Hz)
        channels: Number of channels (default: 1 for mono)
        
    Returns:
        WAV audio bytes (PCM format)
    """
    try:
        logger.info(f"Converting {input_format} audio to WAV (16kHz, mono PCM)")
        
        # Load audio using pydub
        # Note: pydub requires ffmpeg for WebM/Opus support
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format=input_format)
        
        logger.info(f"Loaded audio: {audio.frame_rate}Hz, {audio.channels} channels, {len(audio)}ms duration")
        
        # Convert to mono if needed
        if audio.channels != channels:
            audio = audio.set_channels(channels)
            logger.info(f"Converted to {channels} channel(s)")
        
        # Resample to target sample rate
        if audio.frame_rate != sample_rate:
            audio = audio.set_frame_rate(sample_rate)
            logger.info(f"Resampled to {sample_rate}Hz")
        
        # Export as WAV (PCM) - pydub exports as PCM by default
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)
        
        wav_data = wav_buffer.read()
        logger.info(f"Successfully converted to WAV: {len(wav_data)} bytes")
        
        return wav_data
        
    except Exception as e:
        logger.error(f"Error converting {input_format} to WAV: {e}", exc_info=True)
        # Provide helpful error message
        if "ffmpeg" in str(e).lower() or "codec" in str(e).lower():
            logger.error("pydub requires ffmpeg to handle WebM format. Please install ffmpeg.")
        raise
