"""
2027 그룹 인재육성 체계 수립 - 구성원 교육 Needs 설문조사 독립 웹 앱
(Render 무료 클라우드 배포 및 로컬 실행 겸용)
"""
import os
import json
import time
from datetime import datetime
from flask import Flask, jsonify, request, send_file, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="/static")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

QUESTIONS_FILE = os.path.join(DATA_DIR, "questions.json")
RESPONSES_FILE = os.path.join(DATA_DIR, "responses.json")
EVENT_ENTRIES_FILE = os.path.join(DATA_DIR, "event_entries.json")

def load_json(filepath, default_val):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
    return default_val

def save_json(filepath, data):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving {filepath}: {e}")

@app.route("/")
def index():
    return send_file(os.path.join(BASE_DIR, "index.html"))

@app.route("/config.js")
def serve_config():
    cfg_file = os.path.join(BASE_DIR, "config.js")
    if os.path.exists(cfg_file):
        return send_file(cfg_file, mimetype="application/javascript")
    return "window.GOOGLE_SCRIPT_URL = '';", 200, {"Content-Type": "application/javascript"}

@app.route("/data/<path:filename>")
def serve_data(filename):
    return send_from_directory(DATA_DIR, filename)

@app.route("/api/survey/questions", methods=["GET"])
def get_questions():
    questions = load_json(QUESTIONS_FILE, [])
    return jsonify(questions)

@app.route("/api/survey/submit", methods=["POST"])
def submit_survey():
    data = request.json or {}
    responses = load_json(RESPONSES_FILE, [])
    
    submission_id = f"resp_{int(time.time())}_{len(responses) + 1}"
    record = {
        "id": submission_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "department": data.get("department", "기타"),
        "job_group": data.get("job_group", "일반직"),
        "position": data.get("position", "대리"),
        "delivery_mode": data.get("delivery_mode", "온·오프라인 블렌디드 러닝"),
        "open_needs": data.get("open_needs", ""),
        "open_feedback": data.get("open_feedback", ""),
        "answers": data.get("answers", {})
    }
    responses.append(record)
    save_json(RESPONSES_FILE, responses)
    return jsonify({"success": True, "id": submission_id, "message": "설문이 정상 제출되었습니다."})

@app.route("/api/event/check", methods=["GET"])
def check_event_phone():
    phone = request.args.get("phone", "").strip().replace("-", "")
    if not phone:
        return jsonify({"success": False, "error": "전화번호가 누락되었습니다."}), 400
    
    entries = load_json(EVENT_ENTRIES_FILE, [])
    for e in entries:
        stored_phone = str(e.get("phone", "")).strip().replace("-", "")
        if stored_phone == phone:
            return jsonify({
                "success": True,
                "already_submitted": True,
                "entry_id": e.get("entry_id", ""),
                "submitted_at": e.get("submitted_at", "")
            })
    return jsonify({"success": True, "already_submitted": False})

@app.route("/api/event/submit", methods=["POST"])
def submit_event():
    data = request.json or {}
    phone = data.get("phone", "").strip().replace("-", "")
    survey_id = data.get("survey_id", "")
    
    if not phone or len(phone) < 10 or not phone.startswith("010"):
        return jsonify({"success": False, "error": "올바른 휴대폰 번호(010-XXXX-XXXX)를 입력해 주십시오."}), 400
    
    formatted_phone = f"{phone[:3]}-{phone[3:7]}-{phone[7:11]}" if len(phone) == 11 else f"{phone[:3]}-{phone[3:6]}-{phone[6:10]}"
    entries = load_json(EVENT_ENTRIES_FILE, [])
    
    for e in entries:
        stored_phone = str(e.get("phone", "")).strip().replace("-", "")
        if stored_phone == phone:
            return jsonify({
                "success": False,
                "already_submitted": True,
                "error": f"이미 이벤트 응모가 완료된 번호입니다. ({formatted_phone}) 이벤트 응모는 1인 1회로 한정됩니다.",
                "entry_id": e.get("entry_id")
            }), 400
    
    responses = load_json(RESPONSES_FILE, [])
    matched_resp = next((r for r in responses if r.get("id") == survey_id), {})
    
    entry_id = f"EVT-{int(time.time()) % 10000:04d}-{len(entries) + 1:03d}"
    entry = {
        "entry_id": entry_id,
        "phone": formatted_phone,
        "survey_id": survey_id,
        "submitted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "department": matched_resp.get("department", "미입력"),
        "job_group": matched_resp.get("job_group", "미입력"),
        "position": matched_resp.get("position", "미입력"),
        "is_winner": "미추첨"
    }
    entries.append(entry)
    save_json(EVENT_ENTRIES_FILE, entries)
    return jsonify({"success": True, "entry_id": entry_id, "message": "이벤트 응모가 완료되었습니다."})

@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "2027_employee_survey", "port": int(os.environ.get("PORT", 5001))})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print("=" * 65)
    print(" * 2027 임직원 교육 Needs 설문조사 독립 웹 앱")
    print(f" * 접속 URL: http://localhost:{port}")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=False)
