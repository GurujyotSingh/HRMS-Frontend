import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old_str, new_str in replacements.items():
        new_content = new_content.replace(old_str, new_str)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched: {filepath}")

# Mappings for frontend files
replacements_map = {
    r"d:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\pages\Performance.jsx": {
        "cycleForm.startDate": "cycleForm.start_date",
        "cycleForm.endDate": "cycleForm.end_date",
        "c.startDate": "c.start_date",
        "c.endDate": "c.end_date",
        "startDate:": "start_date:",
        "endDate:": "end_date:"
    },
    r"d:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\pages\Onboarding.jsx": {
        "r.createdAt": "r.created_at",
        "r.lastWorkingDate": "r.last_working_date",
        "offForm.lastWorkingDate": "offForm.last_working_date",
        "viewOff.lastWorkingDate": "viewOff.last_working_date",
        "lastWorkingDate:": "last_working_date:"
    },
    r"d:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\pages\AuditLogs.jsx": {
        "r.createdAt": "r.created_at"
    },
    r"d:\SKIPS_PROJECT\HRMS\Devlopment\university-hrm-frontend\src\components\dashboards\EmployeeDashboard.jsx": {
        "ann.created_at": "ann.created_at" # Already snake_case! Wait, the grep result said ann.created_at
    }
}

for filepath, replacements in replacements_map.items():
    if os.path.exists(filepath):
        replace_in_file(filepath, replacements)
    else:
        print(f"Not found: {filepath}")

print("Done patching.")
