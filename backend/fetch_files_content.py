# fetch_files_content.py
from pymongo import MongoClient
import os

def fetch_all_files():
    client = MongoClient('mongodb://localhost:27017/')
    
    # Connect to the correct database - ai-evaluation-system
    db = client['ai-evaluation-system']
    
    print("🔍 FETCHING ALL FILES FROM DATABASE")
    print("=" * 70)
    
    # Get all files from the files collection
    all_files = list(db.files.find())
    
    print(f"✅ Found {len(all_files)} files in database")
    print("=" * 70)
    
    return all_files

def display_files_with_content():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print("📁 FILES WITH CONTENT DISPLAY")
    print("=" * 70)
    
    # Get all files
    files = list(db.files.find())
    
    for i, file in enumerate(files, 1):
        print(f"\n📄 FILE {i}:")
        print("-" * 50)
        print(f"🆔 File ID: {file.get('fileId', 'N/A')}")
        print(f"📝 Filename: {file.get('filename', 'N/A')}")
        print(f"📄 Original Name: {file.get('originalName', 'N/A')}")
        print(f"📁 File Type: {file.get('fileType', 'N/A')}")
        print(f"📍 File Path: {file.get('filePath', 'N/A')}")
        print(f"📊 File Size: {file.get('fileSize', 'N/A')} bytes")
        print(f"📋 MIME Type: {file.get('mimetype', 'N/A')}")
        print(f"📊 Status: {file.get('status', 'N/A')}")
        
        # Try to read file content if it's a text file
        file_path = file.get('filePath')
        if file_path and file.get('mimetype') == 'text/plain':
            print("\n📖 FILE CONTENT:")
            print("-" * 30)
            try:
                # Fix file path - replace backslashes
                file_path = file_path.replace('\\', '/')
                
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                    print(f"'{content}'")
                else:
                    print("❌ File not found at the specified path")
                    
            except Exception as e:
                print(f"❌ Error reading file: {e}")
        else:
            print("\n📖 FILE CONTENT: [Not a text file or path not available]")
        
        print("-" * 50)

def fetch_specific_file(file_id="1234"):
    """Fetch a specific file by fileId and display its content"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print(f"\n🔍 FETCHING SPECIFIC FILE: {file_id}")
    print("=" * 60)
    
    file = db.files.find_one({"fileId": file_id})
    
    if file:
        print("✅ FILE FOUND:")
        print("=" * 50)
        print(f"🆔 File ID: {file.get('fileId')}")
        print(f"📝 Filename: {file.get('filename')}")
        print(f"📄 Original Name: {file.get('originalName')}")
        print(f"📍 File Path: {file.get('filePath')}")
        print(f"📁 File Type: {file.get('fileType')}")
        print(f"📋 MIME Type: {file.get('mimetype')}")
        
        # Read and display file content
        file_path = file.get('filePath')
        if file_path:
            print("\n📖 FILE CONTENT:")
            print("-" * 30)
            try:
                # Fix file path
                file_path = file_path.replace('\\', '/')
                print(f"📁 Trying to read: {file_path}")
                print(f"📁 File exists: {os.path.exists(file_path)}")
                
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                    print(f"'{content}'")
                else:
                    # Try alternative path
                    alt_path = os.path.join('uploads', os.path.basename(file_path))
                    print(f"🔍 Trying alternative: {alt_path}")
                    if os.path.exists(alt_path):
                        with open(alt_path, 'r', encoding='utf-8') as f:
                            content = f.read().strip()
                        print(f"'{content}'")
                    else:
                        print("❌ File not found at any path")
                        
            except Exception as e:
                print(f"❌ Error reading file: {e}")
        else:
            print("❌ No file path available")
        
        print("=" * 50)
        return file
    else:
        print(f"❌ File with ID '{file_id}' not found!")
        return None

def display_only_text_files():
    """Display only text files with their content"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print("📝 TEXT FILES WITH CONTENT")
    print("=" * 70)
    
    # Get only text files
    text_files = list(db.files.find({"mimetype": "text/plain"}))
    
    if not text_files:
        print("❌ No text files found in database!")
        return
    
    print(f"✅ Found {len(text_files)} text files")
    
    for i, file in enumerate(text_files, 1):
        print(f"\n📄 TEXT FILE {i}:")
        print("-" * 40)
        print(f"🆔 File ID: {file.get('fileId')}")
        print(f"📝 Filename: {file.get('filename')}")
        
        # Read and display content
        file_path = file.get('filePath')
        if file_path:
            try:
                file_path = file_path.replace('\\', '/')
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                    print(f"📖 CONTENT: '{content}'")
                else:
                    print("❌ File not found")
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            print("❌ No file path")

if __name__ == "__main__":
    # Display all files with content
    display_files_with_content()
    
    # Display only text files
    display_only_text_files()
    
    # Fetch specific file (the one with fileId "1234")
    specific_file = fetch_specific_file("1234")
    
    print("\n🎯 FILES READY FOR EVALUATION!")
    print("These file contents can be used as student answers for AI evaluation.")