# simple_display.py
from pymongo import MongoClient

def display_question_and_ref():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation']
    
    print("📋 QUESTION & REFERENCE ANSWER FOR EVALUATION")
    print("=" * 70)
    
    # Fetch question with ID "1234"
    question = db.questions.find_one({"questionId": "1234"})
    
    if question:
        print(f"🆔 QUESTION ID: {question['questionId']}")
        print(f"📝 QUESTION: {question['questionText']}")
        print(f"📚 REFERENCE ANSWER: {question['referenceAnswer']}")
        print(f"🎯 MAXIMUM MARKS: {question['maxMarks']}")
    else:
        print("❌ Question not found!")

if __name__ == "__main__":
    display_question_and_ref()