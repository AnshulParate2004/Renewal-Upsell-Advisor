"""
Language detector utility for multilingual voice bot.
Maps detected language codes to Azure TTS voices and display names.
Supports 9 Indian languages + English.
"""
import unicodedata

# Supported language codes → (display name, Azure TTS voice name)
LANGUAGE_VOICE_MAP: dict[str, tuple[str, str]] = {
    "en-IN": ("English",  "en-IN-NeerjaNeural"),
    "en-US": ("English",  "en-IN-NeerjaNeural"),  # treat US English same as IN
    "hi-IN": ("Hindi",    "hi-IN-AartiNeural"),
    "pa-IN": ("Punjabi",  "pa-IN-OjasNeural"),
    "mr-IN": ("Marathi",  "mr-IN-AarohiNeural"),
    "ta-IN": ("Tamil",    "ta-IN-PallaviNeural"),
    "te-IN": ("Telugu",   "te-IN-MohanNeural"),
    "bn-IN": ("Bengali",  "bn-IN-TanishaaNeural"),
    "gu-IN": ("Gujarati", "gu-IN-DhwaniNeural"),
    "kn-IN": ("Kannada",  "kn-IN-SapnaNeural"),
}

# Ordered list used for Azure AutoDetectSourceLanguageConfig
SUPPORTED_LANGUAGE_CODES: list[str] = [
    "en-IN", "hi-IN", "pa-IN", "mr-IN",
    "ta-IN", "te-IN", "bn-IN", "gu-IN", "kn-IN",
]

DEFAULT_LANGUAGE = "en-IN"
DEFAULT_VOICE    = "en-IN-NeerjaNeural"


def get_voice_for_language(language_code: str) -> str:
    """
    Return the Azure TTS voice name for a given BCP-47 language code.
    Falls back to the default English (India) voice if not found.
    """
    entry = LANGUAGE_VOICE_MAP.get(language_code)
    if entry:
        return entry[1]
    # Try prefix match (e.g. "hi" → "hi-IN")
    prefix = language_code.split("-")[0]
    for code, (_, voice) in LANGUAGE_VOICE_MAP.items():
        if code.startswith(prefix):
            return voice
    return DEFAULT_VOICE


def get_display_name(language_code: str) -> str:
    """
    Return a human-readable language name for a BCP-47 code.
    """
    entry = LANGUAGE_VOICE_MAP.get(language_code)
    if entry:
        return entry[0]
    prefix = language_code.split("-")[0]
    for code, (name, _) in LANGUAGE_VOICE_MAP.items():
        if code.startswith(prefix):
            return name
    return "English"


def normalize_language_code(language_code: str) -> str:
    """
    Normalize a detected language code to one of our supported codes.
    Returns DEFAULT_LANGUAGE if unrecognised.
    """
    if language_code in LANGUAGE_VOICE_MAP:
        return language_code
    # Try prefix match
    prefix = language_code.split("-")[0]
    for code in LANGUAGE_VOICE_MAP:
        if code.startswith(prefix):
            return code
    return DEFAULT_LANGUAGE


def get_language_instruction(language_code: str) -> str:
    """
    Return a system-prompt instruction fragment telling the LLM to respond
    in the user's language. Empty string for English (no extra instruction needed).
    """
    lang = normalize_language_code(language_code)
    name = get_display_name(lang)
    if lang in ("en-IN", "en-US"):
        return (
            "IMPORTANT: The user is speaking in English. "
            "Respond in clear, professional English."
        )
    return (
        f"IMPORTANT: The user is speaking in {name}. "
        f"You MUST respond ENTIRELY in {name}. "
        f"Do NOT mix languages or switch to English."
    )


def detect_language_from_text(text: str) -> str:
    """
    Detect written language from Unicode script ranges — zero latency, zero API call.
    Used in the Twilio path where Twilio already did STT and we only have the text.

    Script → language mapping (first dominant script wins):
      Devanagari (U+0900–U+097F) → could be Hindi or Marathi.
        We check for Marathi-specific conjuncts (ळ, ॅ) to distinguish.
      Gurmukhi  (U+0A00–U+0A7F) → Punjabi
      Tamil     (U+0B80–U+0BFF) → Tamil
      Telugu    (U+0C00–U+0C7F) → Telugu
      Bengali   (U+0980–U+09FF) → Bengali
      Gujarati  (U+0A80–U+0AFF) → Gujarati
      Kannada   (U+0C80–U+0CFF) → Kannada
      Latin     → English (default)
    """
    if not text or not text.strip():
        return DEFAULT_LANGUAGE

    # Count characters per script
    devanagari = gurmukhi = tamil = telugu = bengali = gujarati = kannada = 0
    for ch in text:
        cp = ord(ch)
        if 0x0900 <= cp <= 0x097F:
            devanagari += 1
        elif 0x0A00 <= cp <= 0x0A7F:
            gurmukhi += 1
        elif 0x0B80 <= cp <= 0x0BFF:
            tamil += 1
        elif 0x0C00 <= cp <= 0x0C7F:
            telugu += 1
        elif 0x0980 <= cp <= 0x09FF:
            bengali += 1
        elif 0x0A80 <= cp <= 0x0AFF:
            gujarati += 1
        elif 0x0C80 <= cp <= 0x0CFF:
            kannada += 1

    scores = {
        "devanagari": devanagari,
        "gurmukhi":   gurmukhi,
        "tamil":      tamil,
        "telugu":     telugu,
        "bengali":    bengali,
        "gujarati":   gujarati,
        "kannada":    kannada,
    }
    dominant, count = max(scores.items(), key=lambda x: x[1])

    # Need at least 2 non-Latin chars to be confident
    if count < 2:
        return DEFAULT_LANGUAGE  # English

    if dominant == "devanagari":
        # Marathi-specific characters: ळ (U+0933), ऴ (U+0934), ॅ (U+0945)
        marathi_chars = {"\u0933", "\u0934", "\u0945"}
        if any(ch in marathi_chars for ch in text):
            return "mr-IN"
        return "hi-IN"
    elif dominant == "gurmukhi":
        return "pa-IN"
    elif dominant == "tamil":
        return "ta-IN"
    elif dominant == "telugu":
        return "te-IN"
    elif dominant == "bengali":
        return "bn-IN"
    elif dominant == "gujarati":
        return "gu-IN"
    elif dominant == "kannada":
        return "kn-IN"

    return DEFAULT_LANGUAGE

