"""
2027 그룹 인재육성 체계 수립 - 구성원 교육 Needs 설문조사 독립 웹 앱
(Render 무료 클라우드 배포 및 구글 스프레드시트 안정 연동 프록시 탑재)
"""
import os
import json
import time
import threading
from datetime import datetime
from flask import Flask, jsonify, request, send_file, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="/static")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

QUESTIONS_FILE = os.path.join(DATA_DIR, "questions.json")
RESPONSES_FILE = os.path.join(DATA_DIR, "responses.json")
EVENT_ENTRIES_FILE = os.path.join(DATA_DIR, "event_entries.json")
EVENT_SETTINGS_FILE = os.path.join(DATA_DIR, "event_settings.json")

def get_google_script_url():
    # 1. config.js에서 읽기
    cfg_file = os.path.join(BASE_DIR, "config.js")
    if os.path.exists(cfg_file):
        try:
            with open(cfg_file, "r", encoding="utf-8") as f:
                for line in f:
                    if "GOOGLE_SCRIPT_URL" in line and "http" in line:
                        parts = line.split('"')
                        if len(parts) >= 2 and parts[1].startswith("http"):
                            return parts[1]
        except Exception:
            pass
    # 2. 환경변수 확인
    return os.environ.get("GOOGLE_SCRIPT_URL", "https://script.google.com/macros/s/AKfycbwGgiOiLxFy6a7-gL44E7igImvQ7S-1Ls5wI31MkIN_pzpNjFhp-7kjNS-Vay37KLk/exec")

def forward_to_google_async(payload):
    def _run():
        google_url = get_google_script_url()
        if not google_url:
            return
        try:
            import urllib.request
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                google_url,
                data=data,
                headers={"Content-Type": "text/plain;charset=utf-8"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[Google Sheets Forward OK] status={resp.status}")
        except Exception as e:
            print(f"[Google Sheets Forward Warning] {e}")

    t = threading.Thread(target=_run)
    t.daemon = True
    t.start()

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
    url = get_google_script_url()
    return f'window.GOOGLE_SCRIPT_URL = "{url}";', 200, {"Content-Type": "application/javascript"}

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
    
    submission_id = data.get("id") or f"resp_{int(time.time()*1000)}"
    ans = data.get("answers", {})
    record = {
        "id": submission_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "company": data.get("company") or ans.get("q1_company") or "흥국생명",
        "division": data.get("division") or ans.get("q1_division") or "",
        "department": data.get("department") or ans.get("q1_department") or "기타",
        "job_group": data.get("job_group") or ans.get("q2") or "일반직",
        "position": data.get("position") or ans.get("q3") or "대리",
        "delivery_mode": data.get("delivery_mode", "온·오프라인 블렌디드 러닝"),
        "open_needs": data.get("open_needs", ""),
        "open_feedback": data.get("open_feedback", ""),
        "answers": ans
    }
    responses.append(record)
    save_json(RESPONSES_FILE, responses)
    
    # 구글 스프레드시트에 실시간 행 추가 (백그라운드 안정 전송)
    forward_to_google_async({
        "action": "survey_submit",
        "id": submission_id,
        "submitted_at": record["timestamp"],
        "company": record["company"],
        "division": record["division"],
        "department": record["department"],
        "job_group": record["job_group"],
        "position": record["position"],
        "delivery_mode": record["delivery_mode"],
        "open_needs": record["open_needs"],
        "open_feedback": record["open_feedback"],
        "answers": record["answers"]
    })

    # 사용자에게는 즉시 성공 응답을 내려 부캉이 게임 모달이 지체 없이 열리도록 보장
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


def get_event_settings():
    default_settings = {
        "game_version": 2,
        "quota_life": 160,
        "quota_fire": 200,
        "updated_at": "2026-10-16T18:50:00"
    }
    return load_json(EVENT_SETTINGS_FILE, default_settings)

@app.route("/api/event/settings", methods=["GET", "POST"])
def event_settings_api():
    settings = get_event_settings()
    if request.method == "POST":
        data = request.json or {}
        if "game_version" in data:
            settings["game_version"] = int(data["game_version"])
        if "quota_life" in data:
            settings["quota_life"] = int(data["quota_life"])
        if "quota_fire" in data:
            settings["quota_fire"] = int(data["quota_fire"])
        from datetime import datetime
        settings["updated_at"] = datetime.now().isoformat()
        save_json(EVENT_SETTINGS_FILE, settings)
        return jsonify({"success": True, "message": "이벤트 설정이 즉시 반영되었습니다.", "settings": settings})
    return jsonify({"success": True, "settings": settings})

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
    
    game_version = int(data.get("game_version", 1))
    raw_company = str(data.get("company", "")).strip() or matched_resp.get("company", "흥국생명")
    # Dynamic Event Settings & Quota Check
    evt_settings = get_event_settings()
    target_company = "흥국화재" if "화재" in raw_company else "흥국생명"
    if "game_version" not in data or not data.get("game_version"):
        game_version = int(evt_settings.get("game_version", 2))
    quota_life = int(evt_settings.get("quota_life", 160))
    quota_fire = int(evt_settings.get("quota_fire", 200))
    quota = quota_fire if "화재" in target_company else quota_life

    current_company_winners = sum(1 for e in entries if (target_company in e.get("company", "")) and e.get("winner_status") == "당첨")

    is_winner = False
    if game_version == 2:
        if current_company_winners < quota:
            is_winner = True
            winner_status = "당첨"
        else:
            is_winner = False
            winner_status = "미당첨(선착순마감)"
        rank = current_company_winners + 1
        message = "축하합니다. 커피쿠폰 당첨되셨습니다" if is_winner else "꽝! 수고많으셨습니다"
    else:
        winner_status = "추첨 대기"
        rank = len(entries) + 1
        is_winner = True
        message = "이벤트 응모가 완료되었습니다."

    entry_id = f"EVT-{int(time.time()) % 10000:04d}-{len(entries) + 1:03d}"
    entry = {
        "entry_id": entry_id,
        "phone": formatted_phone,
        "survey_id": survey_id,
        "company": target_company,
        "department": matched_resp.get("department", data.get("department", "미입력")),
        "job_group": matched_resp.get("job_group", data.get("job_group", "미입력")),
        "position": matched_resp.get("position", data.get("position", "미입력")),
        "submitted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "winner_status": winner_status,
        "is_winner": is_winner,
        "rank": rank,
        "game_version": game_version
    }
    entries.append(entry)
    save_json(EVENT_ENTRIES_FILE, entries)

    # 구글 스프레드시트 실시간 전송
    forward_to_google_async({
        "action": "event_submit",
        "entry_id": entry_id,
        "phone": formatted_phone,
        "survey_id": survey_id,
        "company": target_company,
        "department": entry["department"],
        "job_group": entry["job_group"],
        "position": entry["position"],
        "winner_status": winner_status,
        "rank": rank,
        "game_version": game_version
    })

    return jsonify({
        "success": True,
        "entry_id": entry_id,
        "is_winner": is_winner,
        "winner_status": winner_status,
        "company": target_company,
        "rank": rank,
        "quota": quota,
        "game_version": game_version,
        "message": message
    })

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
