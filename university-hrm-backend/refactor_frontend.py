import os
import re

directories_to_scan = [
    'd:/SKIPS_PROJECT/HRMS/Devlopment/university-hrm-frontend/src/pages',
    'd:/SKIPS_PROJECT/HRMS/Devlopment/university-hrm-frontend/src/components',
    'd:/SKIPS_PROJECT/HRMS/Devlopment/university-hrm-frontend/src/services',
]

# Replacements for API payload mappings
replacements = {
    r'\bemployeeId\b': 'employee_id',
    r'\bfirstName\b': 'first_name',
    r'\blastName\b': 'last_name',
    r'\bdepartmentId\b': 'department_id',
    r'\bjoinDate\b': 'join_date',
    r'\bworkEmail\b': 'work_email',
    r'\bprofilePhoto\b': 'profile_photo',
}

# DO NOT replace words that look like React setState or hook variables (e.g. setFirstName, firstName in some forms).
# Wait, if I replace `form.firstName` -> `form.first_name`, I need to make sure the state is updated.
# In my script, I will just apply the regex globally. 
# In JS, `firstName` as a key or property is fine to rename if it's renamed everywhere!
# But wait, `setFirstName` won't be matched by \bfirstName\b because `set` is connected without a word boundary?
# Wait! 'setFirstName' contains 'FirstName', not 'firstName'. So \bfirstName\b will NOT match 'setFirstName'! This is perfect.

def process():
    for directory in directories_to_scan:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.js', '.jsx')):
                    filepath = os.path.join(root, file)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    new_content = content
                    for pattern, repl in replacements.items():
                        new_content = re.sub(pattern, repl, new_content)
                        
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {filepath}")

if __name__ == "__main__":
    process()
