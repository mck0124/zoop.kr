from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import re
import shutil
import os
import threading

app = FastAPI()

# CORS 설정
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3100").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = None
reader_lock = threading.Lock()

def get_reader():
    global reader
    if reader is None:
        with reader_lock:
            if reader is None:
                reader = easyocr.Reader(['ko', 'en'])
    return reader

# 정규식 패턴
biznum_pattern = re.compile(r'\d{3}-\d{2}-\d{5}')
idnum_pattern = re.compile(r'\d{6}-\d{7}')  # 주민등록번호 패턴

@app.post("/ocr")
async def extract_ocr_data(file: UploadFile = File(...)):
    safe_filename = os.path.basename(file.filename or "upload.bin")
    temp_path = os.path.join("/tmp", f"zoop-ocr-{threading.get_ident()}-{safe_filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        lines = get_reader().readtext(temp_path, detail=0)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    biznum = corp_name = ceo_name = address = ""
    is_cert_doc = False  # ✅ 증명원 여부 플래그

    for i, text in enumerate(lines):
        # ✅ 주민번호 탐지 → 증명원 판단
        if idnum_pattern.search(text):
            is_cert_doc = True
            if i + 2 < len(lines):
                address = lines[i + 2].strip()

        # ✅ 사업자등록번호 탐지
        if not biznum:
            match = biznum_pattern.search(text)
            if match:
                biznum = match.group()
                if i >= 2:
                    corp_name = lines[i - 2].strip()
                if i + 2 < len(lines):
                    ceo_name = lines[i + 2].strip()

    return {
        "biznum": biznum,
        "corp_name": corp_name,
        "ceo_name": ceo_name,
        "address": address,
        "is_cert_doc": is_cert_doc,  # ✅ 증명서 여부 반환
        "raw_text": lines             # ✅ 전체 텍스트 반환 (디버깅용)
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ocr", "model_loaded": reader is not None}
