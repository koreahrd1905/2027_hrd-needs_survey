# -*- coding: utf-8 -*-
"""
Questionnaire Generator Service
Generates official printable Survey Questionnaires in MS Word (.docx) and PDF (.pdf)
for 2027 Group HRD Survey.
"""
import os
import json
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_box_borders(cell, color="94A3B8", sz="6"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)


def generate_survey_questionnaire_docx(questions, output_path):
    """
    Generate professional MS Word (.docx) survey questionnaire for printing and distribution.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = docx.Document()

    # Page Margins (A4 standard: 18mm / 0.71 in)
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Header & Footer setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("2027 그룹 인재육성 체계 수립을 위한 구성원 교육 Needs 설문지")
        hrun.font.name = "Malgun Gothic"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("태광그룹 흥국생명 · 흥국화재 HRD 인재육성팀")
        frun.font.name = "Malgun Gothic"
        frun.font.size = Pt(9)
        frun.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Base Font Styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Malgun Gothic'
    font.size = Pt(10)
    font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # 1. Main Title Header
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(8)
    title_p.paragraph_format.space_after = Pt(4)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_pre = title_p.add_run("【 2027 그룹 인재육성 체계 수립 】\n")
    r_pre.font.name = "Malgun Gothic"
    r_pre.font.size = Pt(11)
    r_pre.font.bold = True
    r_pre.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)

    r_main = title_p.add_run("전사 구성원 교육 Needs 설문조사 설문지")
    r_main.font.name = "Malgun Gothic"
    r_main.font.size = Pt(20)
    r_main.font.bold = True
    r_main.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(14)
    r_sub = sub_p.add_run("임직원의 소중한 의견은 2027년도 연간 교육계획 및 직무·디지털 역량 체계 수립의 핵심 자료로 활용됩니다.")
    r_sub.font.name = "Malgun Gothic"
    r_sub.font.size = Pt(9.5)
    r_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # 2. Survey Overview / Guide Table
    guide_table = doc.add_table(rows=2, cols=4)
    guide_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    guide_headers = ["조사 목적", "조사 대상", "소요 시간 / 문항", "비밀 보장 안내"]
    guide_values = [
        "2027년 연간 교육계획 및 인재육성 체계 수립",
        "흥국생명 / 흥국화재 전 임직원",
        "약 5~10분 소요 (총 29문항)",
        "통계법 제33조에 의거 100% 익명 보장"
    ]
    for i in range(4):
        c_h = guide_table.cell(0, i)
        c_h.text = guide_headers[i]
        c_h.paragraphs[0].runs[0].font.bold = True
        c_h.paragraphs[0].runs[0].font.size = Pt(9)
        c_h.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        set_cell_background(c_h, "EEF2F6")
        set_cell_margins(c_h, top=80, bottom=80, left=100, right=100)

        c_v = guide_table.cell(1, i)
        c_v.text = guide_values[i]
        c_v.paragraphs[0].runs[0].font.size = Pt(8.5)
        c_v.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        set_cell_background(c_v, "FFFFFF")
        set_cell_margins(c_v, top=80, bottom=80, left=100, right=100)

    # Set Guide Table borders
    set_table_borders(guide_table, color="CBD5E1", sz="4")

    # Spacing
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 3. Iterate through Sections and Questions
    for s_idx, sec in enumerate(questions, 1):
        sec_title = sec.get("section") or sec.get("title") or f"섹션 {s_idx}"
        sec_desc = sec.get("description") or ""

        # Section Header Banner Table
        sec_tbl = doc.add_table(rows=1, cols=1)
        sec_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        sec_cell = sec_tbl.cell(0, 0)
        set_cell_background(sec_cell, "1E3A8A")
        set_cell_margins(sec_cell, top=100, bottom=100, left=160, right=160)

        sp = sec_cell.paragraphs[0]
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(0)
        s_run = sp.add_run(f"{sec_title}")
        s_run.font.name = "Malgun Gothic"
        s_run.font.size = Pt(11.5)
        s_run.font.bold = True
        s_run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        if sec_desc:
            dp = sec_cell.add_paragraph()
            dp.paragraph_format.space_before = Pt(3)
            dp.paragraph_format.space_after = Pt(0)
            d_run = dp.add_run(sec_desc)
            d_run.font.name = "Malgun Gothic"
            d_run.font.size = Pt(9)
            d_run.font.color.rgb = RGBColor(0x93, 0xC5, 0xFD)

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

        # Questions in this Section
        q_list = sec.get("questions", [])
        for q_idx, q in enumerate(q_list):
            q_num = q.get("number", str(q_idx + 1))
            q_title = q.get("title", "")
            q_type = q.get("type", "single_choice")
            is_req = q.get("required", False)

            # Clean Question Title (avoid duplicate numbers if title already starts with number)
            clean_title = q_title
            if not clean_title.startswith(f"{q_num}.") and not clean_title.startswith(f"Q{q_num}"):
                clean_title = f"{q_num}. {clean_title}"

            qp = doc.add_paragraph()
            qp.paragraph_format.space_before = Pt(8)
            qp.paragraph_format.space_after = Pt(4)
            qp.paragraph_format.keep_with_next = True

            q_num_run = qp.add_run(f"문항 {q_num} ")
            q_num_run.font.bold = True
            q_num_run.font.size = Pt(9.5)
            q_num_run.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)

            q_title_run = qp.add_run(clean_title)
            q_title_run.font.bold = True
            q_title_run.font.size = Pt(10)
            q_title_run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

            if is_req:
                req_run = qp.add_run(" [필수]")
                req_run.font.size = Pt(8.5)
                req_run.font.bold = True
                req_run.font.color.rgb = RGBColor(0xDC, 0x26, 0x26)

            # Render Question Input UI according to type
            if q_type == "company_and_department" or q.get("id") == "q1":
                # Special Q1 Company and Department Table
                comp_tbl = doc.add_table(rows=3, cols=2)
                comp_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(comp_tbl, color="CBD5E1", sz="4")

                # Row 0: Company
                c0_label = comp_tbl.cell(0, 0)
                c0_label.text = "① 소속 회사"
                c0_label.paragraphs[0].runs[0].font.bold = True
                c0_label.paragraphs[0].runs[0].font.size = Pt(9)
                set_cell_background(c0_label, "F8FAFC")
                set_cell_margins(c0_label, top=70, bottom=70, left=100, right=100)

                c0_val = comp_tbl.cell(0, 1)
                c0_val.text = "□ 흥국생명      □ 흥국화재"
                c0_val.paragraphs[0].runs[0].font.size = Pt(9.5)
                set_cell_margins(c0_val, top=70, bottom=70, left=100, right=100)

                # Row 1: Division
                c1_label = comp_tbl.cell(1, 0)
                c1_label.text = "② 실 / 본부"
                c1_label.paragraphs[0].runs[0].font.bold = True
                c1_label.paragraphs[0].runs[0].font.size = Pt(9)
                set_cell_background(c1_label, "F8FAFC")
                set_cell_margins(c1_label, top=70, bottom=70, left=100, right=100)

                c1_val = comp_tbl.cell(1, 1)
                c1_val.text = "(기재란: ____________________________________)"
                c1_val.paragraphs[0].runs[0].font.size = Pt(9.5)
                c1_val.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
                set_cell_margins(c1_val, top=70, bottom=70, left=100, right=100)

                # Row 2: Department
                c2_label = comp_tbl.cell(2, 0)
                c2_label.text = "③ 소속 부서/팀"
                c2_label.paragraphs[0].runs[0].font.bold = True
                c2_label.paragraphs[0].runs[0].font.size = Pt(9)
                set_cell_background(c2_label, "F8FAFC")
                set_cell_margins(c2_label, top=70, bottom=70, left=100, right=100)

                c2_val = comp_tbl.cell(2, 1)
                c2_val.text = "(기재란: ____________________________________)"
                c2_val.paragraphs[0].runs[0].font.size = Pt(9.5)
                c2_val.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
                set_cell_margins(c2_val, top=70, bottom=70, left=100, right=100)

            elif q_type == "likert_5":
                # 5-Point Likert Rating Scale Table
                # Check custom scale options or standard
                options = q.get("options") or [
                    "전혀 그렇지 않다 (1점)",
                    "그렇지 않다 (2점)",
                    "보통이다 (3점)",
                    "그렇다 (4점)",
                    "매우 그렇다 (5점)"
                ]
                
                # Normalize order so 1 is left or right based on options
                scale_tbl = doc.add_table(rows=2, cols=5)
                scale_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(scale_tbl, color="E2E8F0", sz="4")

                # If options list 5점 down to 1점, let's reverse for natural left-to-right 1->5 or keep original
                # In Korean forms, having ① (1점) ~ ⑤ (5점) left to right is standard:
                labels = [
                    "① 전혀 그렇지 않다",
                    "② 그렇지 않다",
                    "③ 보통이다",
                    "④ 그렇다",
                    "⑤ 매우 그렇다"
                ]
                if "만족" in q_title:
                    labels = [
                        "① 매우 불만족",
                        "② 불만족",
                        "③ 보통이다",
                        "④ 만족",
                        "⑤ 매우 만족"
                    ]

                for col_idx in range(5):
                    # Header: label
                    c_hdr = scale_tbl.cell(0, col_idx)
                    c_hdr.text = labels[col_idx]
                    c_hdr.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                    c_hdr.paragraphs[0].runs[0].font.size = Pt(8.5)
                    c_hdr.paragraphs[0].runs[0].font.bold = True
                    c_hdr.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)
                    set_cell_background(c_hdr, "F1F5F9")
                    set_cell_margins(c_hdr, top=60, bottom=60, left=40, right=40)

                    # Rating Radio/Checkbox
                    c_box = scale_tbl.cell(1, col_idx)
                    c_box.text = "[    ]"
                    c_box.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                    c_box.paragraphs[0].runs[0].font.size = Pt(11)
                    c_box.paragraphs[0].runs[0].font.bold = True
                    c_box.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
                    set_cell_margins(c_box, top=60, bottom=60, left=40, right=40)

            elif q_type in ["single_choice", "multiple_choice", "select"]:
                options = q.get("options", [])
                if options:
                    # Multi-column table if many options or 1-column if long text
                    max_len = max([len(str(opt)) for opt in options]) if options else 0
                    if len(options) <= 6 and max_len < 25:
                        cols = 2
                    elif len(options) > 6 and max_len < 28:
                        cols = 2
                    else:
                        cols = 1

                    rows = (len(options) + cols - 1) // cols
                    opt_tbl = doc.add_table(rows=rows, cols=cols)
                    opt_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    set_table_borders(opt_tbl, color="F1F5F9", sz="2")

                    for opt_i, opt_text in enumerate(options):
                        r_idx = opt_i // cols
                        c_idx = opt_i % cols
                        cell = opt_tbl.cell(r_idx, c_idx)
                        cell.text = f"□ {opt_text}"
                        cell.paragraphs[0].runs[0].font.size = Pt(9)
                        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)
                        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)

                    # Fill empty cells if any
                    for opt_i in range(len(options), rows * cols):
                        r_idx = opt_i // cols
                        c_idx = opt_i % cols
                        cell = opt_tbl.cell(r_idx, c_idx)
                        cell.text = ""
                        set_cell_margins(cell, top=50, bottom=50, left=80, right=80)

            elif q_type == "textarea":
                # Subjective Ruled / Box area for written responses
                box_tbl = doc.add_table(rows=1, cols=1)
                box_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = box_tbl.cell(0, 0)
                set_box_borders(cell, color="94A3B8", sz="6")
                set_cell_background(cell, "FAFAFA")
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

                bp = cell.paragraphs[0]
                bp.paragraph_format.space_before = Pt(0)
                bp.paragraph_format.space_after = Pt(28)
                br = bp.add_run("※ 자유롭게 의견을 기재해 주십시오.\n\n\n")
                br.font.size = Pt(9)
                br.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

            # Spacing between questions
            doc.add_paragraph().paragraph_format.space_after = Pt(5)

    # 4. Closing Box / Ending Notice
    end_tbl = doc.add_table(rows=1, cols=1)
    end_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    end_cell = end_tbl.cell(0, 0)
    set_cell_background(end_cell, "F8FAFC")
    set_box_borders(end_cell, color="CBD5E1", sz="6")
    set_cell_margins(end_cell, top=120, bottom=120, left=160, right=160)

    ep = end_cell.paragraphs[0]
    ep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ep.paragraph_format.space_before = Pt(4)
    ep.paragraph_format.space_after = Pt(2)
    er1 = ep.add_run("설문에 끝까지 성실하게 응답해 주셔서 대단히 감사드립니다.\n")
    er1.font.bold = True
    er1.font.size = Pt(10.5)
    er1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    er2 = ep.add_run("임직원 여러분의 소중한 의견은 2027년도 교육 과정 및 HRD 제도 개선에 충실히 반영하겠습니다.\n")
    er2.font.size = Pt(9)
    er2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    er3 = ep.add_run("【 문의처: 태광그룹 흥국생명 · 흥국화재 HRD 인재육성팀 】")
    er3.font.size = Pt(9)
    er3.font.bold = True
    er3.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)

    doc.save(output_path)
    return output_path


def convert_docx_to_pdf_win32(docx_path, pdf_path):
    """
    Converts DOCX to PDF using native MS Word Application COM object.
    Ensures 100% faithful print layout and typography.
    """
    import win32com.client
    import pythoncom

    pythoncom.CoInitialize()
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        abs_docx = os.path.abspath(docx_path)
        abs_pdf = os.path.abspath(pdf_path)
        if os.path.exists(abs_pdf):
            try:
                os.remove(abs_pdf)
            except Exception:
                pass
        doc = word.Documents.Open(abs_docx)
        doc.SaveAs(abs_pdf, FileFormat=17) # 17 = wdFormatPDF
        doc.Close()
        return True
    except Exception as e:
        print(f"[Word COM PDF Conversion Warning] {e}")
        return False
    finally:
        try:
            word.Quit()
        except Exception:
            pass
        pythoncom.CoUninitialize()


def generate_survey_questionnaire_pdf_reportlab(questions, output_path):
    """
    Fallback PDF generator using ReportLab with Malgun Gothic font.
    Guarantees PDF creation even if Word COM is not functioning.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    # Register Korean Font
    font_path = "C:/Windows/Fonts/malgun.ttf"
    bold_font_path = "C:/Windows/Fonts/malgunbd.ttf"
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont("MalgunGothic", font_path))
    if os.path.exists(bold_font_path):
        pdfmetrics.registerFont(TTFont("MalgunGothic-Bold", bold_font_path))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='MalgunGothic-Bold',
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.HexColor('#0F172A')
    )
    badge_style = ParagraphStyle(
        'DocBadge',
        fontName='MalgunGothic-Bold',
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#2563EB')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='MalgunGothic',
        fontSize=9,
        leading=13,
        alignment=1,
        textColor=colors.HexColor('#64748B')
    )
    sec_title_style = ParagraphStyle(
        'SecTitle',
        fontName='MalgunGothic-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.white
    )
    sec_desc_style = ParagraphStyle(
        'SecDesc',
        fontName='MalgunGothic',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#BFDBFE')
    )
    q_title_style = ParagraphStyle(
        'QTitle',
        fontName='MalgunGothic-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )
    q_body_style = ParagraphStyle(
        'QBody',
        fontName='MalgunGothic',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='MalgunGothic',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor('#1E293B')
    )
    table_hdr_style = ParagraphStyle(
        'TableHdr',
        fontName='MalgunGothic-Bold',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor('#1E3A8A')
    )

    story = []

    # Title Banner
    story.append(Paragraph("【 2027 그룹 인재육성 체계 수립 】", badge_style))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("전사 구성원 교육 Needs 설문조사 설문지", title_style))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("임직원의 소중한 의견은 2027년도 연간 교육계획 및 직무·디지털 역량 체계 수립의 핵심 자료로 활용됩니다.", subtitle_style))
    story.append(Spacer(1, 4 * mm))

    # Overview Table
    ov_data = [
        [
            Paragraph("<b>조사 목적</b>", table_hdr_style),
            Paragraph("<b>조사 대상</b>", table_hdr_style),
            Paragraph("<b>소요 시간 / 문항</b>", table_hdr_style),
            Paragraph("<b>비밀 보장 안내</b>", table_hdr_style)
        ],
        [
            Paragraph("2027년 연간 교육계획 수립", table_cell_style),
            Paragraph("흥국생명·흥국화재 전 임직원", table_cell_style),
            Paragraph("약 5~10분 (총 29문항)", table_cell_style),
            Paragraph("통계법 제33조 100% 익명", table_cell_style)
        ]
    ]
    ov_tbl = Table(ov_data, colWidths=[43 * mm, 43 * mm, 43 * mm, 45 * mm])
    ov_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF2F6')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(ov_tbl)
    story.append(Spacer(1, 5 * mm))

    # Iterate Sections
    for sec in questions:
        sec_title = sec.get("section") or sec.get("title") or "섹션"
        sec_desc = sec.get("description") or ""

        sec_content = [
            Paragraph(sec_title, sec_title_style)
        ]
        if sec_desc:
            sec_content.append(Paragraph(sec_desc, sec_desc_style))

        sec_table = Table([[sec_content]], colWidths=[174 * mm])
        sec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1E3A8A')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(KeepTogether([sec_table, Spacer(1, 3 * mm)]))

        for q in sec.get("questions", []):
            q_num = q.get("number", "")
            q_title = q.get("title", "")
            q_type = q.get("type", "single_choice")
            clean_title = q_title
            if not clean_title.startswith(f"{q_num}.") and not clean_title.startswith(f"Q{q_num}"):
                clean_title = f"{q_num}. {clean_title}"

            q_elements = [
                Paragraph(f"<font color='#1D4ED8'><b>문항 {q_num}</b></font> {clean_title}", q_title_style),
                Spacer(1, 1.5 * mm)
            ]

            if q_type == "company_and_department" or q.get("id") == "q1":
                q1_data = [
                    [Paragraph("① 소속 회사", table_hdr_style), Paragraph("□ 흥국생명       □ 흥국화재", q_body_style)],
                    [Paragraph("② 실 / 본부", table_hdr_style), Paragraph("(기재: ____________________________________)", q_body_style)],
                    [Paragraph("③ 소속 부서/팀", table_hdr_style), Paragraph("(기재: ____________________________________)", q_body_style)],
                ]
                q1_tbl = Table(q1_data, colWidths=[38 * mm, 136 * mm])
                q1_tbl.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ]))
                q_elements.append(q1_tbl)

            elif q_type == "likert_5":
                labels = ["① 전혀 아님", "② 그렇지않음", "③ 보통이다", "④ 그렇다", "⑤ 매우그렇다"]
                if "만족" in q_title:
                    labels = ["① 매우불만족", "② 불만족", "③ 보통이다", "④ 만족함", "⑤ 매우만족"]
                
                scale_data = [
                    [Paragraph(lbl, table_hdr_style) for lbl in labels],
                    [Paragraph("[   ]", table_cell_style) for _ in labels]
                ]
                scale_tbl = Table(scale_data, colWidths=[34.8 * mm] * 5)
                scale_tbl.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]))
                q_elements.append(scale_tbl)

            elif q_type in ["single_choice", "multiple_choice", "select"]:
                opts = q.get("options", [])
                opt_rows = []
                for i in range(0, len(opts), 2):
                    c1 = Paragraph(f"□ {opts[i]}", q_body_style)
                    c2 = Paragraph(f"□ {opts[i+1]}", q_body_style) if i + 1 < len(opts) else Paragraph("", q_body_style)
                    opt_rows.append([c1, c2])

                if opt_rows:
                    opt_tbl = Table(opt_rows, colWidths=[87 * mm, 87 * mm])
                    opt_tbl.setStyle(TableStyle([
                        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ]))
                    q_elements.append(opt_tbl)

            elif q_type == "textarea":
                txt_data = [[Paragraph("※ 자유롭게 의견을 기재해 주십시오.<br/><br/><br/>", q_body_style)]]
                txt_tbl = Table(txt_data, colWidths=[174 * mm])
                txt_tbl.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAFAFA')),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94A3B8')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ]))
                q_elements.append(txt_tbl)

            q_elements.append(Spacer(1, 3.5 * mm))
            story.append(KeepTogether(q_elements))

    # Closing Banner
    closing_data = [[
        Paragraph(
            "<font color='#1E3A8A'><b>설문에 성실하게 응답해 주셔서 대단히 감사드립니다.</b></font><br/>"
            "<font color='#475569'>임직원 여러분의 소중한 의견은 2027년도 교육 과정 및 HRD 제도 개선에 충실히 반영하겠습니다.<br/>"
            "【 문의처: 태광그룹 흥국생명·흥국화재 HRD 인재육성팀 】</font>",
            table_cell_style
        )
    ]]
    closing_tbl = Table(closing_data, colWidths=[174 * mm])
    closing_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 4 * mm))
    story.append(closing_tbl)

    doc.build(story)
    return output_path


def generate_survey_questionnaire_pdf(questions, output_path, docx_source_path=None):
    """
    High-fidelity PDF generator.
    Attempts MS Word COM conversion first (exact match to Word layout).
    Falls back to ReportLab generator if COM fails.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_docx = docx_source_path
    created_temp = False

    if not temp_docx or not os.path.exists(temp_docx):
        temp_docx = output_path.replace(".pdf", "_temp.docx")
        generate_survey_questionnaire_docx(questions, temp_docx)
        created_temp = True

    # Try Word COM
    try:
        success = convert_docx_to_pdf_win32(temp_docx, output_path)
        if success and os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            if created_temp and os.path.exists(temp_docx):
                try:
                    os.remove(temp_docx)
                except Exception:
                    pass
            return output_path
    except Exception as e:
        print(f"[Word COM Conversion Attempt Failed] {e}")

    # Fallback: ReportLab
    print("[PDF Fallback] Using ReportLab generator...")
    generate_survey_questionnaire_pdf_reportlab(questions, output_path)
    if created_temp and os.path.exists(temp_docx):
        try:
            os.remove(temp_docx)
        except Exception:
            pass
    return output_path
