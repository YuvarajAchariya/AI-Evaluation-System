# fetch_questions_fixed.py
from pymongo import MongoClient

def fetch_all_questions():
    client = MongoClient('mongodb://localhost:27017/')
    
    # Connect to the correct database - ai-evaluation-system
    db = client['ai-evaluation-system']
    
    print("🔍 FETCHING ALL QUESTIONS FROM DATABASE")
    print("=" * 70)
    
    # Get all questions from the questions collection
    questions = list(db.questions.find())
    
    print(f"✅ Found {len(questions)} questions in database")
    print("=" * 70)
    
    # Display each question with all details
    for i, question in enumerate(questions, 1):
        print(f"\n📋 QUESTION {i}:")
        print("-" * 50)
        print(f"🆔 Question ID: {question.get('questionId', 'N/A')}")
        print(f"❓ Question Text: {question.get('questionText', 'N/A')}")
        print(f"📚 Reference Answer: {question.get('referenceAnswer', 'N/A')}")
        print(f"🎯 Max Marks: {question.get('maxMarks', 'N/A')}")
        print(f"📝 Subject: {question.get('subjectName', 'N/A')}")
        print(f"📊 Difficulty: {question.get('difficulty', 'N/A')}")
        print(f"📖 Question Type: {question.get('questionType', 'N/A')}")
        print(f"🔑 Keywords: {', '.join(question.get('keywords', []))}")
        print(f"✅ Active: {question.get('isActive', 'N/A')}")
        print(f"📅 Created: {question.get('createdAt', 'N/A')}")
    
    return questions

def fetch_specific_question(question_id="1234"):
    """Fetch a specific question by ID"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print(f"\n🔍 FETCHING SPECIFIC QUESTION: {question_id}")
    print("=" * 60)
    
    question = db.questions.find_one({"questionId": question_id})
    
    if question:
        print("✅ QUESTION FOUND:")
        print("=" * 50)
        print(f"🆔 Question ID: {question.get('questionId')}")
        print(f"❓ Question: {question.get('questionText')}")
        print(f"📚 Reference Answer: {question.get('referenceAnswer')}")
        print(f"🎯 Max Marks: {question.get('maxMarks')}")
        print(f"📝 Subject: {question.get('subjectName')}")
        print(f"📊 Difficulty: {question.get('difficulty')}")
        print("=" * 50)
        return question
    else:
        print(f"❌ Question with ID '{question_id}' not found!")
        return None

if __name__ == "__main__":
    # Fetch all questions
    all_questions = fetch_all_questions()
    
    # Fetch specific question
    specific_question = fetch_specific_question("1234")
    
    print("\n🎯 READY FOR EVALUATION!")
    print("These questions can now be used for AI evaluation.")