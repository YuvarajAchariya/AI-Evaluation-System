# get_evaluation_data.py
from pymongo import MongoClient

def get_questions_for_evaluation():
    """
    Fetch all questions with their reference answers for AI evaluation
    """
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print("🎯 QUESTIONS FOR AI EVALUATION")
    print("=" * 70)
    
    questions = list(db.questions.find({"isActive": True}))
    
    evaluation_data = []
    
    for question in questions:
        print(f"\n📝 Question ID: {question.get('questionId')}")
        print(f"   Question: {question.get('questionText')}")
        print(f"   Reference: {question.get('referenceAnswer')}")
        print(f"   Max Marks: {question.get('maxMarks')}")
        print("   " + "-" * 40)
        
        # Store data for evaluation
        evaluation_data.append({
            'questionId': question.get('questionId'),
            'questionText': question.get('questionText'),
            'referenceAnswer': question.get('referenceAnswer'),
            'maxMarks': question.get('maxMarks'),
            'subject': question.get('subjectName')
        })
    
    print(f"\n✅ Total questions ready for evaluation: {len(evaluation_data)}")
    return evaluation_data

if __name__ == "__main__":
    data = get_questions_for_evaluation()
    
    # Now you can use this data for AI evaluation
    print(f"\n🎯 You can now feed {len(data)} questions to the AI model!")