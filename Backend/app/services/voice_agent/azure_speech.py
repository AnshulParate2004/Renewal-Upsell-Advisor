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
    
    def text_to_speech(self, text: str, voice_name: Optional[str] = None) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: Text to convert
            voice_name: Optional voice name (e.g., 'en-US-AriaNeural')
            
        Returns:
            Audio bytes
        """
        if not self.speech_config:
            raise ValueError("Azure Speech not configured")
        
        if voice_name:
            self.speech_config.speech_synthesis_voice_name = voice_name
        
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config)
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return result.audio_data
        else:
            logger.error(f"Speech synthesis failed: {result.reason}")
            raise RuntimeError(f"Speech synthesis failed: {result.reason}")
    
    def speech_to_text(self, audio_data: bytes, language: str = "en-US", audio_format: str = "webm") -> str:
        """
        Convert speech audio to text.
        
        Args:
            audio_data: Audio bytes
            language: Language code (default: en-US)
            audio_format: Audio format (webm, wav, etc.)
            
        Returns:
            Transcribed text
        """
        if not self.speech_config:
            raise ValueError("Azure Speech not configured")
        
        try:
            import tempfile
            import os
            
            # Use file-based recognition (more reliable for WAV format)
            # Save to temporary file with appropriate extension
            file_suffix = '.wav' if audio_format.lower() == 'wav' else '.webm'
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
            
            try:
                # Use file-based audio config (Azure Speech SDK handles WAV files well)
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
