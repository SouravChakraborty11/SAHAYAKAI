from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.core.ai.gemini import get_gemini_client
import base64

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_language: str

@router.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    client = get_gemini_client()
    if not client:
        return {"extracted_text": "OCR requires Gemini API Key configuration."}
        
    try:
        # Read the file content
        content = await file.read()
        
        # Prepare for Gemini
        # We use flash model for OCR as well
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents=[
                "Extract all text from this image and return it exactly as it appears. Do not add any extra commentary.",
                {"mime_type": file.content_type or "image/jpeg", "data": content}
            ]
        )
        
        return {"extracted_text": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_text(request: TranslateRequest):
    client = get_gemini_client()
    if not client:
        return {"translated_text": f"[{request.target_language}] {request.text}"}
        
    prompt = f"Translate the following text to {request.target_language}. Return ONLY the translated text.\\n\\nText: {request.text}"
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        return {"translated_text": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
