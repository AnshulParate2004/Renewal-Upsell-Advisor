"""
Audio format converter for converting WebM and other formats to WAV for Azure Speech Service.
Uses ffmpeg via subprocess to avoid the pydub/audioop dependency on Python 3.13+.
"""
import shutil
import subprocess
from app.core.logging import get_logger

logger = get_logger(__name__)


def _ffmpeg_available() -> bool:
    """Return True if ffmpeg is on PATH."""
    return shutil.which("ffmpeg") is not None


def _convert_via_ffmpeg(
    audio_data: bytes,
    input_format: str,
    sample_rate: int = 16000,
    channels: int = 1,
) -> bytes:
    """
    Convert audio to PCM WAV using ffmpeg (stdin -> stdout).
    Raises FileNotFoundError if ffmpeg is not installed, RuntimeError on conversion failure.
    """
    if not _ffmpeg_available():
        raise FileNotFoundError(
            "ffmpeg is required for audio conversion. Please install ffmpeg and ensure it is on PATH."
        )
    cmd = [
        "ffmpeg",
        "-nostdin",
        "-y",
        "-f",
        input_format,
        "-i",
        "pipe:0",
        "-acodec",
        "pcm_s16le",
        "-ar",
        str(sample_rate),
        "-ac",
        str(channels),
        "-f",
        "wav",
        "pipe:1",
    ]
    try:
        proc = subprocess.run(
            cmd,
            input=audio_data,
            capture_output=True,
            timeout=60,
            check=False,
        )
    except subprocess.TimeoutExpired:
        logger.error("ffmpeg conversion timed out")
        raise RuntimeError("Audio conversion timed out.") from None
    if proc.returncode != 0:
        stderr = (proc.stderr or b"").decode("utf-8", errors="replace").strip()
        logger.error("ffmpeg failed (returncode=%s): %s", proc.returncode, stderr)
        raise RuntimeError(f"Audio conversion failed: {stderr or 'unknown error'}")
    return proc.stdout


def convert_webm_to_wav(
    audio_data: bytes, sample_rate: int = 16000, channels: int = 1
) -> bytes:
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
        logger.info("Converting WebM to WAV (%sHz, %s channel(s))", sample_rate, channels)
        wav_data = _convert_via_ffmpeg(
            audio_data, "webm", sample_rate=sample_rate, channels=channels
        )
        logger.info("Converted to WAV: %s bytes", len(wav_data))
        return wav_data
    except (FileNotFoundError, RuntimeError):
        raise
    except Exception as e:
        logger.error("Error converting WebM to WAV: %s", e, exc_info=True)
        raise


def convert_to_pcm_wav(
    audio_data: bytes,
    input_format: str = "webm",
    sample_rate: int = 16000,
    channels: int = 1,
) -> bytes:
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
        logger.info(
            "Converting %s audio to WAV (%sHz, %s channel(s) PCM)",
            input_format,
            sample_rate,
            channels,
        )
        wav_data = _convert_via_ffmpeg(
            audio_data, input_format, sample_rate=sample_rate, channels=channels
        )
        logger.info("Successfully converted to WAV: %s bytes", len(wav_data))
        return wav_data
    except FileNotFoundError as e:
        logger.error("ffmpeg is required for %s conversion. Please install ffmpeg.", input_format)
        raise
    except (FileNotFoundError, RuntimeError):
        raise
    except Exception as e:
        logger.error("Error converting %s to WAV: %s", input_format, e, exc_info=True)
        raise
