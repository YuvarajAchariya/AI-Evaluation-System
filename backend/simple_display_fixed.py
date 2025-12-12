# simple_display_fixed.py
from pymongo import MongoClient

def display_questions():
    client = MongoClient('mongodb://localhost:27017/')
    
    # Correct database name
    db = client['ai-evaluation-system']
    
    print("📋 QUESTIONS FROM DATABASE")
    print("=" * 70)
    
    # Get all questions
    questions = list(db.questions.find())
    
    for i, question in enumerate(questions, 1):
        print(f"\n[{i}] QUESTION DETAILS:")
        print(f"   ID: {question.get('questionId')}")
        print(f"   TEXT: {question.get('questionText')}")
        print(f"   REFERENCE: {question.get('referenceAnswer')}")
        print(f"   MARKS: {question.get('maxMarks')}")
        print(f"   SUBJECT: {question.get('subjectName')}")

if __name__ == "__main__":
    display_questions()