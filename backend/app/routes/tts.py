"""Text-to-Speech (TTS) routes for WINC AI OS.
Provides natural Brazilian Portuguese (pt-BR) male voice synthesis using Edge Neural TTS.
Features audio caching, ultra-low latency, and zero local RAM model overhead.
"""

import os
import hashlib
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import STORAGE_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tts", tags=["TTS"])

AUDIO_CACHE_DIR = STORAGE_DIR / "audio_cache"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_MALE_VOICE = "pt-BR-AntonioNeural"

OFFICIAL_VOICES = [
    {
        "id": "pt-BR-AntonioNeural",
        "name": "Antonio Neural (pt-BR)",
        "gender": "Masculina",
        "age": "Adulto Jovem",
        "style": "Natural, Confiante, Médio-grave (Oficial WINC Master AI)",
        "provider": "Edge Neural TTS",
        "recommended": True
    },
    {
        "id": "pt-BR-FabioNeural",
        "name": "Fabio Neural (pt-BR)",
        "gender": "Masculina",
        "age": "Adulto",
        "style": "Formal, Grave",
        "provider": "Edge Neural TTS",
        "recommended": False
    },
    {
        "id": "web_speech",
        "name": "Voz Nativa do Navegador / Sistema",
        "gender": "Masculina",
        "age": "Sistema Operacional",
        "style": "Web Speech API (Execução 100% no cliente)",
        "provider": "Nativo",
        "recommended": False
    }
]

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = DEFAULT_MALE_VOICE
    rate: Optional[str] = "+0%"
    volume: Optional[str] = "+0%"

@router.get("/voices")
def list_voices() -> List[Dict[str, Any]]:
    """Return available high quality male Portuguese voices."""
    return OFFICIAL_VOICES

@router.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    """Synthesize text into a natural pt-BR male voice audio file."""
    text_clean = req.text.strip()
    if not text_clean:
        raise HTTPException(status_code=400, detail="Texto não fornecido")

    # Limit text length to avoid overly long audio generations in voice chat
    if len(text_clean) > 800:
        text_clean = text_clean[:800] + "..."

    voice = req.voice or DEFAULT_MALE_VOICE
    rate = req.rate or "+0%"

    # Generate persistent cache hash
    cache_key = f"{voice}_{rate}_{text_clean}"
    file_hash = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()[:24]
    file_path = AUDIO_CACHE_DIR / f"{file_hash}.mp3"
    relative_url = f"/storage/audio_cache/{file_hash}.mp3"

    # Return cached audio if already generated
    if file_path.exists() and file_path.stat().st_size > 100:
        return {
            "status": "ok",
            "audio_url": relative_url,
            "voice": voice,
            "cached": True
        }

    try:
        import edge_tts
        communicate = edge_tts.Communicate(text_clean, voice, rate=rate)
        await communicate.save(str(file_path))

        return {
            "status": "ok",
            "audio_url": relative_url,
            "voice": voice,
            "cached": False
        }
    except Exception as ex:
        logger.error(f"TTS synthesis error: {ex}")
        # Return fallback signal so frontend can fallback to Web Speech API smoothly
        return {
            "status": "fallback",
            "error": str(ex),
            "fallback_to_web_speech": True,
            "text": text_clean
        }

@router.get("/sample")
async def get_sample_voice():
    """Synthesize and return sample audio for the official WINC Master AI voice."""
    sample_text = (
        "Olá! Eu sou o WINC Master AI, seu assistente virtual de inteligência artificial. "
        "Estou pronto para organizar projetos e coordenar nossa equipe de agentes para você."
    )
    res = await synthesize_speech(SynthesizeRequest(text=sample_text, voice=DEFAULT_MALE_VOICE))
    return res
