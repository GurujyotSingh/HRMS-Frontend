import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from app.db.models.payroll import PayrollRun
from app.db.models.user import User
from app.services.encryption_service import decrypt_value


def generate_payslip_pdf(run: PayrollRun, employee: User) -> str:
    """
    Generates a professional PDF payslip and saves it to the static directory.
    Returns the relative URL path to the generated PDF.
    """
    # Ensure directory exists
    pdf_dir = "app/static/payslips"
    os.makedirs(pdf_dir, exist_ok=True)
    
    filename = f"Payslip_{employee.first_name}_{employee.last_name}_{run.payroll_month}_{run.payroll_year}.pdf".replace(" ", "_")
    file_path = os.path.join(pdf_dir, filename)
    
    # Decrypt financial data
    gross_salary = decrypt_value(run.gross_salary) or "0.00"
    net_salary = decrypt_value(run.net_salary) or "0.00"
    total_earnings = decrypt_value(run.total_earnings) or "0.00"
    total_deductions = decrypt_value(run.total_deductions) or "0.00"

    doc = SimpleDocTemplate(file_path, pagesize=letter,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=18)
    
    Story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'), # Professional Navy Blue
        alignment=1, # Center
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.gray,
        alignment=1, # Center
        spaceAfter=24
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6,
        spaceBefore=12
    )
    
    normal_style = styles["Normal"]

    # --- Header ---
    Story.append(Paragraph("<b>University Global</b>", title_style))
    month_name = datetime.strptime(str(run.payroll_month), "%m").strftime("%B")
    Story.append(Paragraph(f"<b>Payslip for the month of {month_name} {run.payroll_year}</b>", subtitle_style))
    
    # --- Employee Details ---
    employee_data = [
        ["Employee Name:", f"{employee.first_name} {employee.last_name}", "Employee ID:", employee.employee_id or "N/A"],
        ["Email:", employee.email, "Department:", "University Staff"],
        ["Role:", str(employee.role).replace("_", " ").title() if employee.role else "N/A", "Status:", run.status]
    ]
    
    # --- Statutory Details ---
    # We display them under the employee info if available
    employee_data.append([
        "PAN:", employee.pan_number or "Not Provided",
        "UAN:", employee.uan_number or "Not Provided"
    ])
    
    if employee.bank_name or employee.bank_account_number:
        employee_data.append([
            "Bank Name:", employee.bank_name or "Not Provided",
            "Account No:", employee.bank_account_number or "Not Provided"
        ])
    
    emp_table = Table(employee_data, colWidths=[1.5*inch, 2.5*inch, 1.5*inch, 1.5*inch])
    emp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#334155')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    
    Story.append(emp_table)
    Story.append(Spacer(1, 24))
    
    # --- Salary Components ---
    earnings = []
    deductions = []
    
    if run.components:
        for comp in run.components:
            amt = decrypt_value(comp.amount) or "0.00"
            if comp.component_type.lower() == 'earning':
                earnings.append([comp.component_name, f"INR {amt}"])
            else:
                deductions.append([comp.component_name, f"INR {amt}"])

    if not earnings: earnings.append(["Basic Pay", f"INR {gross_salary}"])
    
    # Make lists same length for table
    max_len = max(len(earnings), len(deductions))
    earnings += [["", ""]] * (max_len - len(earnings))
    deductions += [["", ""]] * (max_len - len(deductions))
    
    comp_data = [["Earnings", "Amount", "Deductions", "Amount"]]
    for i in range(max_len):
        comp_data.append([earnings[i][0], earnings[i][1], deductions[i][0], deductions[i][1]])
        
    comp_data.append(["Total Earnings", f"INR {total_earnings}", "Total Deductions", f"INR {total_deductions}"])
    
    comp_table = Table(comp_data, colWidths=[2.5*inch, 1*inch, 2.5*inch, 1*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')), # Header bg
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke), # Header text
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'), # Amount right aligned
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'), # Amount right aligned
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # Footer bold
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f1f5f9')), # Footer bg
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    
    Story.append(Paragraph("<b>Salary Breakdown</b>", section_style))
    Story.append(comp_table)
    Story.append(Spacer(1, 24))
    
    # --- Net Salary ---
    net_table = Table([["Net Salary Transfer:", f"INR {net_salary}"]], colWidths=[5*inch, 2*inch])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#059669')), # Green bg
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 12),
    ]))
    
    Story.append(net_table)
    Story.append(Spacer(1, 40))
    
    Story.append(Spacer(1, 30))
    
    # --- Payment Rules & Details ---
    rules_style = ParagraphStyle(
        'RulesStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#475569'),
        leading=14
    )
    
    Story.append(Paragraph("<b>Payment Details & Rules:</b>", ParagraphStyle('RulesHeader', parent=styles['Heading4'], textColor=colors.HexColor('#1e3a8a'))))
    rules_text = (
        "1. <b>Tax Deductions:</b> All applicable taxes, including Professional Tax and TDS, are deducted as per current government regulations.<br/>"
        "2. <b>Discrepancies:</b> Any discrepancies in this payslip must be reported to the HR department within 7 working days.<br/>"
        "3. <b>Confidentiality:</b> Your salary details are highly confidential. Please do not discuss or share this payslip with other employees.<br/>"
        "4. <b>Transfer Protocol:</b> The Net Salary Transfer has been credited directly to the registered bank account on file."
    )
    Story.append(Paragraph(rules_text, rules_style))
    Story.append(Spacer(1, 30))
    
    # --- Footer ---
    Story.append(Paragraph("<i>This is a system-generated payslip and does not require a physical signature.</i>", 
                           ParagraphStyle('Footer', parent=styles['Normal'], alignment=1, textColor=colors.gray)))

    # Build the PDF
    doc.build(Story)
    
    return f"/static/payslips/{filename}"
