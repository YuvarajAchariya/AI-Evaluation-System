# quick_check.py
from pymongo import MongoClient
import os

def quick_check():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation']
    
    print("🔍 QUICK DATABASE CHECK")
    print("=" * 40)
    
    # Check files
    files = list(db.files.find({"fileType": "answer_sheet"}))
    print(f"📁 Answer sheets: {len(files)}")
    
    for file in files:
        print(f"\n📄 File: {file.get('filename')}")
        print(f"   fileId: {file.get('fileId')}")
        print(f"   filePath: {file.get('filePath')}")
        
        # Check if file exists
        file_path = file.get('filePath', '').replace('\\', '/')
        exists = os.path.exists(file_path)
        print(f"   File exists: {exists}")
        
        if exists:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                print(f"   Content: '{content}'")
            except Exception as e:
                print(f"   Read error: {e}")
    
    # Check questions
    questions = list(db.questions.find())
    print(f"\n❓ Questions: {len(questions)}")
    for q in questions:
        print(f"   📝 {q['questionId']}: {q['questionText'][:30]}...")

if __name__ == "__main__":
    quick_check()