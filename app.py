# -*- coding: utf-8 -*-
"""
Main Flask Application for HRD Survey & Strategy Dashboard
"""
import os
import json
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename

KST = timezone(timedelta(hours=9))

def get_kst_now_str():
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")

from services.file_parser import parse_survey_file, parse_2025_report_file
from services.report_generator import generate_docx_report, generate_pptx_report, generate_excel_raw_data, generate_event_excel
from services.questionnaire_generator import generate_survey_questionnaire_docx, generate_survey_questionnaire_pdf
from services.analytics import compute_survey_stats, get_strategy_data

app = Flask(__name__, static_folder="static", template_folder=".")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

QUESTIONS_FILE = os.path.join(DATA_DIR, "questions.json")
RESPONSES_FILE = os.path.join(DATA_DIR, "responses.json")
COMPARISON_2025_FILE = os.path.join(DATA_DIR, "comparison_2025.json")
EVENT_ENTRIES_FILE = os.path.join(DATA_DIR, "event_entries.json")
EVENT_SETTINGS_FILE = os.path.join(DATA_DIR, "event_settings.json")

def load_json(filepath, default_val):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
    return default_val

def save_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/")
def index():
    return send_file(os.path.join(BASE_DIR, "index.html"))

@app.route("/dashboard")
def dashboard_view():
    return send_file(os.path.join(BASE_DIR, "index.html"))

@app.route("/survey")
def survey_view():
    return send_file(os.path.join(BASE_DIR, "survey.html"))

@app.route("/game")
def game_demo_view():
    return send_file(os.path.join(BASE_DIR, "game.html"))

@app.route("/bukang")
def bukang_demo_view():
    return send_file(os.path.join(BASE_DIR, "game.html"))

@app.route("/data/<path:filename>")
def serve_data(filename):
    return send_from_directory(DATA_DIR, filename)

@app.route("/config.js")
def serve_config_js():
    return send_file(os.path.join(BASE_DIR, "config.js"), mimetype="application/javascript")

# 1. Questions API
@app.route("/api/survey/questions", methods=["GET", "POST"])
def survey_questions():
    if request.method == "POST":
        new_questions = request.json
        if not new_questions:
            return jsonify({"success": False, "error": "문항 데이터가 비어있습니다."}), 400
        save_json(QUESTIONS_FILE, new_questions)
        return jsonify({"success": True, "message": "설문 문항이 성공적으로 저장되었습니다.", "questions": new_questions})
    
    questions = load_json(QUESTIONS_FILE, [])
    return jsonify({"success": True, "questions": questions})

# 2. Upload Survey Questions File (PPTX, PDF)
@app.route("/api/survey/upload-questions", methods=["POST"])
def upload_questions():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "업로드된 파일이 없습니다."}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "선택된 파일이 없습니다."}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pptx", ".pdf"]:
        return jsonify({"success": False, "error": "PPTX 또는 PDF 파일만 업로드할 수 있습니다."}), 400

    save_path = os.path.join(UPLOADS_DIR, filename)
    file.save(save_path)

    try:
        parsed_questions = parse_survey_file(save_path)
        # Prepend default demographic fields if not present
        existing_demographics = None
        current_qs = load_json(QUESTIONS_FILE, [])
        for q in current_qs:
            if q.get("id") == "demographics":
                existing_demographics = q
                break

        final_questions = []
        if existing_demographics:
            final_questions.append(existing_demographics)
        final_questions.extend(parsed_questions)

        save_json(QUESTIONS_FILE, final_questions)
        return jsonify({
            "success": True,
            "filename": filename,
            "count": len(parsed_questions),
            "questions": final_questions,
            "message": f"'{filename}' 파일에서 {len(parsed_questions)}개의 설문 문항을 성공적으로 추출하여 웹 설문지로 변환했습니다."
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"파일 파싱 중 오류가 발생했습니다: {str(e)}"}), 500

# 3. Submit Survey Response
@app.route("/api/survey/submit", methods=["POST"])
def submit_response():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "응답 데이터가 없습니다."}), 400

    ans = data.get("answers", {})

    # Validate required survey questions
    questions = load_json(QUESTIONS_FILE, [])
    for sec in questions:
        for q in sec.get("questions", []):
            if q.get("required"):
                qid = q.get("id")
                if qid == "q1" or q.get("type") == "company_and_department":
                    if not (ans.get("q1_company") and ans.get("q1_division") and ans.get("q1_department")):
                        return jsonify({"success": False, "error": f"1번 (소속 회사, 실/본부, 소속 부서)은 필수 응답 문항입니다."}), 400
                else:
                    val = ans.get(qid)
                    if val is None or val == "" or (isinstance(val, list) and len(val) == 0):
                        return jsonify({"success": False, "error": f"{q.get('number', qid)}번 문항은 필수 답변 항목입니다."}), 400

    responses = load_json(RESPONSES_FILE, [])
    resp_id = data.get("id") or f"RESP-2026-{len(responses) + 1:04d}"
    data["id"] = resp_id

    # 제출 일시는 엄격하게 한국 표준시(KST) YYYY-MM-DD HH:MM:SS 규격으로 통일
    sub_at = data.get("submitted_at")
    if not sub_at or "T" in str(sub_at) or "Z" in str(sub_at):
        data["submitted_at"] = get_kst_now_str()
    else:
        data["submitted_at"] = str(sub_at)

    ans = data.get("answers", {})
    if "company" not in data or not data["company"]:
        data["company"] = ans.get("q1_company") or ans.get("company") or "흥국생명"
    if "division" not in data or not data["division"]:
        data["division"] = ans.get("q1_division") or ans.get("division") or ""
    if "department" not in data or not data["department"]:
        data["department"] = ans.get("q1_department") or ans.get("department") or "관리부문"
    if "job_group" not in data or not data["job_group"]:
        data["job_group"] = ans.get("q2") or ans.get("q2_job_group") or ans.get("job_group") or "일반직"
    if "position" not in data or not data["position"]:
        data["position"] = ans.get("q3") or ans.get("q3_position") or ans.get("position") or "과장"

    responses.append(data)
    save_json(RESPONSES_FILE, responses)

    # Google Sheets Forwarding (Async)
    def _forward():
        try:
            import urllib.request
            google_url = "https://script.google.com/macros/s/AKfycbzuTmrL-8iKFZIaqxZSrZsINSfTRkFXViUtFLopta9ArEsDIor3lMTdViCM6FujLdI/exec"
            payload = {
                "action": "survey_submit",
                "id": resp_id,
                "submitted_at": data.get("submitted_at") or get_kst_now_str(),
                "company": data["company"],
                "division": data["division"],
                "department": data["department"],
                "job_group": data["job_group"],
                "position": data["position"],
                "delivery_mode": data.get("delivery_mode", ""),
                "open_needs": data.get("open_needs", ""),
                "open_feedback": data.get("open_feedback", ""),
                "answers": data.get("answers", {})
            }
            req = urllib.request.Request(
                google_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "text/plain;charset=utf-8"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[Google Sheets Forward OK] status={resp.status}")
        except Exception as e:
            print(f"[Google Sheets Forward Warning] {e}")

    import threading
    t = threading.Thread(target=_forward)
    t.daemon = True
    t.start()

    return jsonify({
        "success": True,
        "id": resp_id,
        "message": "설문 응답이 성공적으로 등록되었습니다. 대시보드 통계에 실시간 반영되었습니다."
    })

# 3-1. Event Lucky Draw Entry (Starbucks Coupon Entry)

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
        target_2027 = r"c:\실습\DEV\2027 구성원 교육니즈 설문조사\data\event_settings.json"
        if os.path.exists(os.path.dirname(target_2027)):
            save_json(target_2027, settings)
        return jsonify({"success": True, "message": "이벤트 설정이 즉시 반영되었습니다.", "settings": settings})
    return jsonify({"success": True, "settings": settings})


@app.route("/api/admin/deploy-github", methods=["POST"])
def deploy_to_github_api():
    try:
        import subprocess
        deploy_dir = r"c:\실습\DEV\2027 구성원 교육니즈 설문조사"
        subprocess.run(["git", "add", "."], cwd=deploy_dir, capture_output=True, text=True)
        from datetime import datetime
        commit_msg = f"Update survey & event settings: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=deploy_dir, capture_output=True, text=True)
        push_res = subprocess.run(["git", "push", "origin", "main"], cwd=deploy_dir, capture_output=True, text=True)
        if push_res.returncode == 0:
            return jsonify({"success": True, "message": "GitHub에 성공적으로 푸시되었습니다! Render 클라우드에서 1~2분 내로 자동 재배포됩니다."})
        else:
            return jsonify({"success": False, "error": push_res.stderr or push_res.stdout})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/event/submit", methods=["POST"])
def submit_event_entry():
    data = request.json or {}
    phone = str(data.get("phone", "")).strip()
    survey_id = str(data.get("survey_id", "")).strip()
    
    clean_digits = "".join([c for c in phone if c.isdigit()])
    if len(clean_digits) < 10 or not clean_digits.startswith("010"):
        return jsonify({"success": False, "error": "올바른 휴대전화 번호(010-XXXX-XXXX)를 입력해 주십시오."}), 400

    from datetime import datetime
    entries = load_json(EVENT_ENTRIES_FILE, [])
    
    # Format phone number
    if len(clean_digits) == 11:
        formatted_phone = f"{clean_digits[:3]}-{clean_digits[3:7]}-{clean_digits[7:]}"
    elif len(clean_digits) == 10:
        formatted_phone = f"{clean_digits[:3]}-{clean_digits[3:6]}-{clean_digits[6:]}"
    else:
        formatted_phone = phone

    # 1인 1회 한정 응모 검증: 이미 응모 완료된 휴대전화 번호인지 확인
    for existing in entries:
        existing_digits = "".join([c for c in existing.get("phone", "") if c.isdigit()])
        if existing_digits == clean_digits:
            return jsonify({
                "success": False,
                "error": f"이미 이벤트 응모가 완료된 휴대전화 번호({formatted_phone})입니다. 1인 1회만 응모 가능합니다."
            }), 400

    # Game Version & Company Quota check (Game 2 Real-Time Race)
    game_version = int(data.get("game_version", 1))
    req_company = str(data.get("company", "")).strip()

    # Search demographic info from responses if survey_id is linked
    company = "-"
    department = "-"
    position = "-"
    if survey_id and survey_id != "TEST-PREVIEW":
        responses = load_json(RESPONSES_FILE, [])
        for r in responses:
            if str(r.get("id")) == survey_id:
                company = r.get("company") or r.get("answers", {}).get("company") or "-"
                department = r.get("department") or r.get("answers", {}).get("department") or "-"
                position = r.get("position") or r.get("answers", {}).get("position") or "-"
                break

    if req_company and company in ["-", ""]:
        company = req_company

    # Dynamic Event Settings & Quota Check
    evt_settings = get_event_settings()
    target_company = "흥국화재" if "화재" in company else "흥국생명"
    if "game_version" not in data or not data.get("game_version"):
        game_version = int(evt_settings.get("game_version", 2))
    quota_life = int(evt_settings.get("quota_life", 160))
    quota_fire = int(evt_settings.get("quota_fire", 200))
    quota = quota_fire if "화재" in target_company else quota_life

    current_company_winners = 0
    for e in entries:
        if (target_company in e.get("company", "")) and e.get("winner_status") == "당첨":
            current_company_winners += 1

    is_fire = ("화재" in target_company)
    prefix = "EVT-F" if is_fire else "EVT-L"

    # [회사별 카운팅 분리] 생명 / 화재 응모자 수 독립 카운팅 (EVT-L001, EVT-F001)
    company_entries_count = sum(1 for e in entries if (is_fire and "화재" in e.get("company", "")) or (not is_fire and "화재" not in e.get("company", "")))
    rank = company_entries_count + 1
    entry_id = f"{prefix}{rank:03d}"

    is_winner = False
    if game_version == 2:
        if current_company_winners < quota:
            is_winner = True
            winner_status = "당첨"
        else:
            is_winner = False
            winner_status = "미당첨(선착순마감)"
        message = "축하합니다. 커피쿠폰 당첨" if is_winner else "꽝! 수고많으셨습니다"
    else:
        winner_status = "추첨 대기"
        is_winner = True
        message = "부캉이와 함께하는 스타벅스 쿠폰 럭키드로우 응모가 완료되었습니다!"

    entry = {
        "id": entry_id,
        "entry_id": entry_id,
        "phone": formatted_phone,
        "survey_id": survey_id or "-",
        "company": target_company,
        "department": department,
        "position": position,
        "submitted_at": get_kst_now_str(),
        "winner_status": winner_status,
        "rank": rank,
        "game_version": game_version
    }
    entries.append(entry)
    save_json(EVENT_ENTRIES_FILE, entries)

    return jsonify({
        "success": True,
        "entry_id": entry["id"],
        "is_winner": is_winner if game_version == 2 else True,
        "winner_status": winner_status,
        "company": target_company,
        "rank": rank,
        "quota": quota,
        "game_version": game_version,
        "message": message
    })

# 3-2. Event Entries Count & Stats
@app.route("/api/event/stats", methods=["GET"])
def get_event_stats():
    entries = load_json(EVENT_ENTRIES_FILE, [])
    return jsonify({
        "success": True,
        "total_entries": len(entries),
        "recent_entries": entries[-10:] if entries else []
    })

# 3-2-1. Check duplicate phone entry (1인 1회 한정 응모 사전 점검)
@app.route("/api/event/check", methods=["GET"])
def check_event_phone():
    phone = str(request.args.get("phone", "")).strip()
    clean_digits = "".join([c for c in phone if c.isdigit()])
    if len(clean_digits) < 10:
        return jsonify({"success": True, "already_submitted": False})
    
    entries = load_json(EVENT_ENTRIES_FILE, [])
    for existing in entries:
        existing_digits = "".join([c for c in existing.get("phone", "") if c.isdigit()])
        if existing_digits == clean_digits:
            return jsonify({
                "success": True,
                "already_submitted": True,
                "entry_id": existing.get("id"),
                "submitted_at": existing.get("submitted_at")
            })
    return jsonify({"success": True, "already_submitted": False})

# 3-3. Download Starbucks Event Entries Excel (.xlsx)
@app.route("/api/event/export-excel", methods=["GET"])
def download_event_excel():
    entries = load_json(EVENT_ENTRIES_FILE, [])
    output_path = os.path.join(REPORTS_DIR, "Starbucks_Event_Entries.xlsx")
    generate_event_excel(entries, output_path)

    return send_file(
        output_path,
        as_attachment=True,
        download_name="2026_스타벅스_커피쿠폰_이벤트응모자_명단.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# 4. Survey Statistics (Recharts Data)
@app.route("/api/survey/stats", methods=["GET"])
def get_stats():
    responses = load_json(RESPONSES_FILE, [])
    stats = compute_survey_stats(responses)
    return jsonify({"success": True, "stats": stats})

# 5. 2025 Comparison Data API
@app.route("/api/survey/comparison-2025", methods=["GET"])
def get_comparison():
    comp_data = load_json(COMPARISON_2025_FILE, {})
    return jsonify({"success": True, "comparison": comp_data})

# 6. Upload 2025 Past Report File
@app.route("/api/survey/upload-2025", methods=["POST"])
def upload_2025():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "파일이 첨부되지 않았습니다."}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "선택된 파일이 없습니다."}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pptx", ".pdf", ".xlsx", ".xls"]:
        return jsonify({"success": False, "error": "PPTX, PDF 또는 Excel 파일만 지원됩니다."}), 400

    save_path = os.path.join(UPLOADS_DIR, filename)
    file.save(save_path)

    try:
        comp_data = parse_2025_report_file(save_path)
        save_json(COMPARISON_2025_FILE, comp_data)
        return jsonify({
            "success": True,
            "filename": filename,
            "comparison": comp_data,
            "message": f"'{filename}' 분석 완료! 2025년 비교 데이터가 갱신되었습니다."
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"2025년 보고서 파싱 오류: {str(e)}"}), 500

# 7. Strategy Data API
@app.route("/api/strategy", methods=["GET"])
def get_strategy():
    strategy_data = get_strategy_data()
    return jsonify({"success": True, "strategy": strategy_data})

# 8. Download Word (.docx) Report
@app.route("/api/reports/docx", methods=["GET"])
def download_docx():
    responses = load_json(RESPONSES_FILE, [])
    stats = compute_survey_stats(responses)
    comparison_2025 = load_json(COMPARISON_2025_FILE, {})
    strategy_data = get_strategy_data()

    output_path = os.path.join(REPORTS_DIR, "HRD_Survey_Analysis_and_2027_Strategy.docx")
    generate_docx_report(stats, comparison_2025, strategy_data, output_path)

    return send_file(
        output_path,
        as_attachment=True,
        download_name="2026_전사_교육니즈분석_및_2027_인재육성전략보고서.docx",
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# 9. Download PowerPoint (.pptx) Report
@app.route("/api/reports/pptx", methods=["GET"])
def download_pptx():
    responses = load_json(RESPONSES_FILE, [])
    stats = compute_survey_stats(responses)
    comparison_2025 = load_json(COMPARISON_2025_FILE, {})
    strategy_data = get_strategy_data()

    output_path = os.path.join(REPORTS_DIR, "HRD_2027_Talent_Development_Strategy.pptx")
    generate_pptx_report(stats, comparison_2025, strategy_data, output_path)

    return send_file(
        output_path,
        as_attachment=True,
        download_name="2027_인재육성체계_및_추진전략_발표보고서.pptx",
        mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

# 10. Download Full Survey Raw Data Excel (.xlsx)
@app.route("/api/survey/export-excel", methods=["GET"])
def download_excel_raw():
    responses = load_json(RESPONSES_FILE, [])
    questions = load_json(QUESTIONS_FILE, [])

    output_path = os.path.join(REPORTS_DIR, "HRD_Survey_Raw_Data_2026.xlsx")
    generate_excel_raw_data(responses, questions, output_path)

    return send_file(
        output_path,
        as_attachment=True,
        download_name="2026_전사_교육니즈설문_최종응답_로우데이터.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# 10-1. Download Survey Questionnaire Word (.docx)
@app.route("/api/survey/export-docx", methods=["GET"])
@app.route("/api/survey/export-word", methods=["GET"])
@app.route("/api/survey/export-questionnaire-docx", methods=["GET"])
def download_survey_questionnaire_docx():
    questions = load_json(QUESTIONS_FILE, [])
    output_path = os.path.join(REPORTS_DIR, "2027_구성원_교육니즈_설문조사_설문지.docx")
    generate_survey_questionnaire_docx(questions, output_path)

    return send_file(
        output_path,
        as_attachment=True,
        download_name="2027_구성원_교육니즈_설문조사_설문지.docx",
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# 10-2. Download Survey Questionnaire PDF (.pdf)
@app.route("/api/survey/export-pdf", methods=["GET"])
@app.route("/api/survey/export-questionnaire-pdf", methods=["GET"])
def download_survey_questionnaire_pdf():
    questions = load_json(QUESTIONS_FILE, [])
    docx_path = os.path.join(REPORTS_DIR, "2027_구성원_교육니즈_설문조사_설문지.docx")
    pdf_path = os.path.join(REPORTS_DIR, "2027_구성원_교육니즈_설문조사_설문지.pdf")

    # Generate fresh docx first
    generate_survey_questionnaire_docx(questions, docx_path)
    generate_survey_questionnaire_pdf(questions, pdf_path, docx_source_path=docx_path)

    is_inline = request.args.get("view") == "1" or request.args.get("inline") == "1"
    return send_file(
        pdf_path,
        as_attachment=not is_inline,
        download_name="2027_구성원_교육니즈_설문조사_설문지.pdf",
        mimetype="application/pdf"
    )

ADMIN_CONFIG_FILE = os.path.join(DATA_DIR, "admin_config.json")

def get_admin_pin():
    cfg = load_json(ADMIN_CONFIG_FILE, {"admin_pin": "2027"})
    return str(cfg.get("admin_pin", "2027")).strip()

def set_admin_pin(new_pin):
    cfg = load_json(ADMIN_CONFIG_FILE, {"admin_pin": "2027"})
    cfg["admin_pin"] = str(new_pin).strip()
    from datetime import datetime
    cfg["updated_at"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    save_json(ADMIN_CONFIG_FILE, cfg)

# 11. Reset Survey Responses with Admin PIN
@app.route("/api/survey/reset", methods=["POST"])
def reset_survey_responses():
    data = request.json or {}
    pin = str(data.get("pin", "")).strip()
    saved_pin = get_admin_pin()

    # 관리자 설정 비밀번호 검증 (또는 마스터 복구 PIN: 0000)
    if pin != saved_pin and pin != "0000":
        return jsonify({
            "success": False,
            "error": "비밀번호가 일치하지 않습니다. 올바른 관리자 비밀번호를 입력해 주십시오."
        }), 403

    # Reset responses to empty
    save_json(RESPONSES_FILE, [])

    # Reset event entries if requested
    reset_event = data.get("reset_event", False)
    if reset_event:
        save_json(EVENT_ENTRIES_FILE, [])

    return jsonify({
        "success": True,
        "message": "설문 응답 데이터가 0건으로 성공적으로 초기화(리셋)되었습니다."
    })

# 11-1. Reset Event Entries Standalone Endpoint
@app.route("/api/event/reset", methods=["POST"])
def reset_event_entries_endpoint():
    data = request.json or {}
    pin = str(data.get("pin", "")).strip()
    saved_pin = get_admin_pin()

    if pin != saved_pin and pin != "0000":
        return jsonify({
            "success": False,
            "error": "관리자 비밀번호가 일치하지 않습니다."
        }), 403

    save_json(EVENT_ENTRIES_FILE, [])
    return jsonify({
        "success": True,
        "message": "스타벅스 이벤트 응모자 명단이 0건으로 초기화되었습니다."
    })

# 12. Change Admin PIN Endpoint
@app.route("/api/admin/change-pin", methods=["POST"])
def change_admin_pin_endpoint():
    data = request.json or {}
    current_pin = str(data.get("current_pin", "")).strip()
    new_pin = str(data.get("new_pin", "")).strip()

    saved_pin = get_admin_pin()
    if current_pin != saved_pin and current_pin != "0000":
        return jsonify({
            "success": False,
            "error": "현재 관리자 비밀번호가 일치하지 않습니다."
        }), 400

    if not new_pin or len(new_pin) < 4:
        return jsonify({
            "success": False,
            "error": "새 비밀번호는 4자리 이상(숫자/문자)으로 입력해 주십시오."
        }), 400

    set_admin_pin(new_pin)
    return jsonify({
        "success": True,
        "message": "관리자 비밀번호가 성공적으로 변경되었습니다."
    })

# Reset to demo dataset
@app.route("/api/admin/reset-demo", methods=["POST"])
def reset_demo():
    import subprocess
    subprocess.run(["python", "generate_mock_data.py"])
    return jsonify({"success": True, "message": "데모 데이터가 초기화되었습니다."})

if __name__ == "__main__":
    print("Starting HRD Survey & Strategy Dashboard on http://localhost:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=True)
