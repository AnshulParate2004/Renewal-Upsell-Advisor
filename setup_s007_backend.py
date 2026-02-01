import os

base_path = r"D:\Internship\Renewal-Upsell-Advisor\S-007-Backend"

structure = {
    "directories": [
        "app",
        "app/api",
        "app/core",
        "app/db",
        "app/services",
        "data",
        "scripts"
    ],
    "files": [
        "app/__init__.py",
        "app/main.py",
        "app/api/__init__.py",
        "app/api/dashboard.py",
        "app/api/advisor.py",
        "app/core/config.py",
        "app/db/connection.py",
        "app/db/schema.sql",
        "app/services/__init__.py",
        "app/services/llm_engine.py",
        "data/s007_synthetic_data.csv",
        "data/demo.db",
        "scripts/seed_db.py",
        ".env",
        "requirements.txt",
        "README.md"
    ]
}

def create_structure():
    if not os.path.exists(base_path):
        os.makedirs(base_path)
    
    for dir_name in structure["directories"]:
        dir_path = os.path.join(base_path, dir_name)
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created directory: {dir_path}")

    for file_name in structure["files"]:
        file_path = os.path.join(base_path, file_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            pass # Create empty file
        print(f"Created file: {file_path}")

if __name__ == "__main__":
    create_structure()
