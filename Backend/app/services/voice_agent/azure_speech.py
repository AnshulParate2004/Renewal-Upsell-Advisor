"""
Azure Speech Service for voice interactions.
"""
from typing import Optional
try:
    import azure.cognitiveservices.speech as speechsdk
    AZURE_SDK_AVAILABLE = True
except ImportError:
    speechsdk = None
    AZURE_SDK_AVAILABLE = False
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AzureSpeechService:
    """Service for Azure Speech-to-Text and Text-to-Speech."""
    
    def __init__(self):
        """Initialize Azure Speech service."""
        if not AZURE_SDK_AVAILABLE:
            logger.warning("Azure Speech SDK not installed. Voice features disabled.")
            self.speech_config = None
        elif not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
            logger.warning("Azure Speech credentials not configured")
            self.speech_config = None
        else:
            self.speech_config = speechsdk.SpeechConfig(
                subscription=settings.AZURE_SPEECH_KEY,
                region=settings.AZURE_SPEECH_REGION
            )
    
    def text_to_speech(self, text: str, voice_name: Optional[str] = None, raw_8k: bool = False) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: Text to convert
            voice_name: Optional voice name (e.g., 'en-US-AriaNeural')
            raw_8k: If True, outputs Raw16Bit8000HzMono PCM without WAV headers
            
        Returns:
            Audio bytes
        """
        if not self.speech_config:
            raise ValueError("Azure Speech not configured")
        
        # Create a FRESH SpeechConfig per call to avoid shared-state mutation
        # (voice_name and output format are sticky on the config object)
        config = speechsdk.SpeechConfig(
            subscription=self.speech_config.subscription_key,
            region=self.speech_config.region,
        )
        
        # Set voice — default to Indian English if none specified
        config.speech_synthesis_voice_name = voice_name or "en-IN-NeerjaNeural"
            
        if raw_8k:
            config.set_speech_synthesis_output_format(
                speechsdk.SpeechSynthesisOutputFormat.Raw16Bit8000HzMonoPcm
            )
        
        # CRITICAL: pass audio_config=None so the SDK does NOT try to open
        # system speakers (which don't exist on headless containers).
        # audio_data is still populated in the result object.
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=config, audio_config=None)
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            logger.info(f"TTS succeeded: {len(result.audio_data)} bytes for '{text[:40]}...'")
            return result.audio_data
        else:
            # Log cancellation details for easier debugging
            details = ""
            if result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                details = f" | CancelReason={cancellation.reason}, ErrorDetails={cancellation.error_details}"
            logger.error(f"Speech synthesis failed: {result.reason}{details}")
            raise RuntimeError(f"Speech synthesis failed: {result.reason}{details}")
    
    def speech_to_text(self, audio_data: bytes, language: str = "en-IN", audio_format: str = "webm", is_raw_pcm_8k: bool = False) -> str:
        """
        Convert speech audio to text.
        
        Args:
            audio_data: Audio bytes
            language: Language code (default: en-IN)
            audio_format: Audio format (webm, wav, etc.)
            is_raw_pcm_8k: If True, treats audio_data as raw 16-bit 8kHz mono PCM and creates a stream
            
        Returns:
            Transcribed text
        """
        if not self.speech_config:
            raise ValueError("Azure Speech not configured")
            
        if is_raw_pcm_8k:
            try:
                # Use Push stream to process raw PCM 8000Hz 16-bit mono
                stream_format = speechsdk.audio.AudioStreamFormat(samples_per_second=8000, bits_per_sample=16, channels=1)
                push_stream = speechsdk.audio.PushAudioInputStream(stream_format=stream_format)
                audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
                
                recognizer = speechsdk.SpeechRecognizer(
                    speech_config=self.speech_config,
                    audio_config=audio_config,
                    language=language
                )
                
                # Write the raw PCM bytes into the stream and close it
                push_stream.write(audio_data)
                push_stream.close()
                
                result = recognizer.recognize_once_async().get()
                
                if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                    logger.info(f"Successfully recognized speech: {result.text[:50]}...")
                    return result.text
                else:
                    return ""
            except Exception as e:
                logger.error(f"Error in raw PCM STT: {e}")
                return ""
        
        try:
            import tempfile
            import os
            
            # Use file-based recognition (more reliable for WAV/WEBM format)
            # Save to temporary file with appropriate extension
            file_suffix = '.wav' if audio_format.lower() == 'wav' else '.webm'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
            
            try:
                # Use file-based audio config
                audio_config = speechsdk.audio.AudioConfig(filename=tmp_file_path)
                recognizer = speechsdk.SpeechRecognizer(
                    speech_config=self.speech_config,
                    audio_config=audio_config,
                    language=language
                )
                
                result = recognizer.recognize_once_async().get()
                
                if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                    logger.info(f"Successfully recognized speech: {result.text[:50]}...")
                    return result.text
                elif result.reason == speechsdk.ResultReason.NoMatch:
                    logger.warning("No speech could be recognized from audio")
                    return ""
                else:
                    logger.error(f"Speech recognition failed: {result.reason}")
                    return ""
            finally:
                # Clean up temp file
                if os.path.exists(tmp_file_path):
                    try:
                        os.unlink(tmp_file_path)
                    except:
                        pass
        except Exception as e:
            logger.error(f"Error in speech_to_text: {e}", exc_info=True)
            return ""


# Global instance
azure_speech = AzureSpeechService()
