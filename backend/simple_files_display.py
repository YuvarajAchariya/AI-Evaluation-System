# simple_files_display.py
from pymongo import MongoClient
import os

def display_text_files_simple():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print("📝 TEXT FILES IN DATABASE")
    print("=" * 50)
    
    # Get text files
    text_files = list(db.files.find({"mimetype": "text/plain"}))
    
    for file in text_files:
        print(f"\n📄 File ID: {file.get('fileId')}")
        print(f"📝 Name: {file.get('filename')}")
        
        # Read content
        file_path = file.get('filePath', '').replace('\\', '/')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                print(f"📖 Content: '{content}'")
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            print("❌ File not found")

if __name__ == "__main__":
    display_text_files_simple()