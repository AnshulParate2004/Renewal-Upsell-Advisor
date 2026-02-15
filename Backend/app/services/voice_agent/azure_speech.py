"""
Azure Speech Service for voice interactions.
"""
from typing import Optional
import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AzureSpeechService:
    """Service for Azure Speech-to-Text and Text-to-Speech."""
    
    def __init__(self):
        """Initialize Azure Speech service."""
        if not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
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
    
    def speech_to_text(self, audio_data: bytes, language: str = "en-US") -> str:
        """
        Convert speech audio to text.
        
        Args:
            audio_data: Audio bytes
            language: Language code (default: en-US)
            
        Returns:
            Transcribed text
        """
        if not self.speech_config:
            raise ValueError("Azure Speech not configured")
        
        audio_config = speechsdk.audio.AudioConfig(stream=speechsdk.audio.PushAudioInputStream())
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config,
            audio_config=audio_config,
            language=language
        )
        
        # Write audio data to stream
        audio_stream = speechsdk.audio.PushAudioInputStream()
        audio_stream.write(audio_data)
        audio_stream.close()
        
        result = recognizer.recognize_once_async().get()
        
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            logger.warning("No speech could be recognized")
            return ""
        else:
            logger.error(f"Speech recognition failed: {result.reason}")
            raise RuntimeError(f"Speech recognition failed: {result.reason}")


# Global instance
azure_speech = AzureSpeechService()
