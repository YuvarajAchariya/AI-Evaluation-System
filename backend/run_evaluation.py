import sys
import os
from pymongo import MongoClient
from bson import ObjectId

# Add the services directory to Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'services'))

try:
    from evaluate_answers import evaluate_all_files, get_uploaded_files_from_db, get_questions_from_db
    print("✅ Successfully imported evaluation functions from services folder")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("📁 Make sure evaluate_answers.py is in the services directory")
    sys.exit(1)

def display_evaluation_accuracy():
    """
    Display accuracy and evaluation results in the console
    """
    API_KEY = "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"
    
    print("🔍 AI EVALUATION SYSTEM - ACCURACY REPORT")
    print("=" * 70)
    
    # Connect to database for statistics
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['ai-evaluation']
        
        # Get statistics
        total_questions = db.questions.count_documents({"isActive": True})
        total_files = db.files.count_documents({"fileType": "answer_sheet"})
        total_evaluations = db.evaluations.count_documents({})
        
        print(f"📊 DATABASE STATISTICS:")
        print(f"   • Total Questions: {total_questions}")
        print(f"   • Total Answer Sheets: {total_files}")
        print(f"   • Total Evaluations: {total_evaluations}")
        print()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return
    
    # Run the evaluation
    print("🚀 STARTING AUTOMATIC EVALUATION...")
    print("-" * 70)
    
    try:
        results = evaluate_all_files(
            api_key=API_KEY,
            student_id="CONSOLE_STUDENT",
            evaluator_id="CONSOLE_EVALUATOR"
        )
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
        return
    
    print("\n" + "=" * 70)
    print("🎯 EVALUATION RESULTS SUMMARY")
    print("=" * 70)
    
    if not results:
        print("❌ No evaluations were processed.")
        return
    
    # Calculate overall statistics
    total_marks = sum(result['marksAwarded'] for result in results)
    max_total_marks = sum(result['maxMarks'] for result in results)
    overall_percentage = (total_marks / max_total_marks) * 100 if max_total_marks > 0 else 0
    
    # Calculate accuracy metrics
    total_questions_evaluated = len(results)
    average_score = total_marks / total_questions_evaluated if total_questions_evaluated > 0 else 0
    average_percentage = sum(result['percentage'] for result in results) / total_questions_evaluated
    
    print(f"📈 OVERALL PERFORMANCE:")
    print(f"   • Questions Evaluated: {total_questions_evaluated}")
    print(f"   • Total Score: {total_marks:.1f}/{max_total_marks:.1f}")
    print(f"   • Overall Percentage: {overall_percentage:.2f}%")
    print(f"   • Average Score per Question: {average_score:.2f}")
    print(f"   • Average Percentage: {average_percentage:.2f}%")
    print()
    
    # Group by file and display individual file results
    files_dict = {}
    for result in results:
        file_name = result.get('fileName', 'Unknown')
        if file_name not in files_dict:
            files_dict[file_name] = []
        files_dict[file_name].append(result)
    
    print("📄 FILE-WISE BREAKDOWN:")
    print("-" * 50)
    
    for file_name, file_results in files_dict.items():
        file_marks = sum(r['marksAwarded'] for r in file_results)
        file_max_marks = sum(r['maxMarks'] for r in file_results)
        file_percentage = (file_marks / file_max_marks) * 100 if file_max_marks > 0 else 0
        
        print(f"   📁 {file_name}")
        print(f"      • Questions: {len(file_results)}")
        print(f"      • Score: {file_marks:.1f}/{file_max_marks:.1f}")
        print(f"      • Percentage: {file_percentage:.2f}%")
    
    print()
    
    # Display individual question results
    print("🔍 DETAILED QUESTION RESULTS:")
    print("-" * 70)
    
    for i, result in enumerate(results, 1):
        question_id = result['questionId']
        marks = result['marksAwarded']
        max_marks = result['maxMarks']
        percentage = result['percentage']
        
        # Performance indicator
        if percentage >= 80:
            performance = "🎉 EXCELLENT"
        elif percentage >= 60:
            performance = "✅ GOOD"
        elif percentage >= 40:
            performance = "⚠️  AVERAGE"
        else:
            performance = "❌ NEEDS IMPROVEMENT"
        
        print(f"   {i:2d}. Q{question_id}: {marks:.1f}/{max_marks} ({percentage:.1f}%) - {performance}")
    
    print()
    
    # Display accuracy analysis
    print("📊 ACCURACY ANALYSIS:")
    print("-" * 50)
    
    # Calculate grade distribution
    excellent = len([r for r in results if r['percentage'] >= 80])
    good = len([r for r in results if 60 <= r['percentage'] < 80])
    average = len([r for r in results if 40 <= r['percentage'] < 60])
    poor = len([r for r in results if r['percentage'] < 40])
    
    print(f"   • 🎉 Excellent (80%+): {excellent} questions")
    print(f"   • ✅ Good (60-79%): {good} questions")
    print(f"   • ⚠️  Average (40-59%): {average} questions")
    print(f"   • ❌ Needs Improvement (<40%): {poor} questions")
    
    # Calculate pass/fail rate (assuming 40% is passing)
    passed = len([r for r in results if r['percentage'] >= 40])
    failed = len([r for r in results if r['percentage'] < 40])
    pass_rate = (passed / total_questions_evaluated) * 100 if total_questions_evaluated > 0 else 0
    
    print(f"\n   • 📈 Pass Rate: {pass_rate:.1f}% ({passed}/{total_questions_evaluated})")
    print(f"   • 📉 Fail Rate: {100 - pass_rate:.1f}% ({failed}/{total_questions_evaluated})")
    
    print()
    print("=" * 70)
    print("✅ EVALUATION COMPLETED SUCCESSFULLY!")
    print("=" * 70)

def quick_evaluation():
    """
    Quick evaluation without detailed reports
    """
    API_KEY = "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"
    
    print("🚀 QUICK EVALUATION")
    print("=" * 50)
    
    try:
        results = evaluate_all_files(API_KEY)
        
        if results:
            total_marks = sum(r['marksAwarded'] for r in results)
            max_marks = sum(r['maxMarks'] for r in results)
            percentage = (total_marks / max_marks * 100) if max_marks > 0 else 0
            
            print(f"✅ Evaluated {len(results)} questions")
            print(f"📊 Score: {total_marks:.1f}/{max_marks:.1f} ({percentage:.1f}%)")
            
            # Show top 5 results
            print("\n🏆 TOP 5 RESULTS:")
            sorted_results = sorted(results, key=lambda x: x['percentage'], reverse=True)[:5]
            for i, result in enumerate(sorted_results, 1):
                print(f"   {i}. Q{result['questionId']}: {result['marksAwarded']}/{result['maxMarks']} ({result['percentage']:.1f}%)")
        else:
            print("❌ No evaluations processed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Choose evaluation mode:")
    print("1. 📊 Full Accuracy Report")
    print("2. ⚡ Quick Evaluation")
    print("3. 🔍 Check Database Status")
    
    try:
        choice = input("Enter choice (1, 2, or 3): ").strip()
        
        if choice == "1":
            display_evaluation_accuracy()
        elif choice == "2":
            quick_evaluation()
        elif choice == "3":
            # Check database status
            try:
                client = MongoClient('mongodb://localhost:27017/')
                db = client['ai-evaluation']
                
                questions = db.questions.count_documents({})
                files = db.files.count_documents({})
                evaluations = db.evaluations.count_documents({})
                
                print(f"📊 DATABASE STATUS:")
                print(f"   • Questions: {questions}")
                print(f"   • Files: {files}")
                print(f"   • Evaluations: {evaluations}")
                
                # Show recent files
                recent_files = list(db.files.find().sort("uploadDate", -1).limit(3))
                if recent_files:
                    print(f"\n📁 RECENT FILES:")
                    for file in recent_files:
                        status = file.get('status', 'unknown')
                        print(f"   • {file['originalName']} - {status}")
                
            except Exception as e:
                print(f"❌ Database error: {e}")
        else:
            print("❌ Invalid choice")
            
    except KeyboardInterrupt:
        print("\n⏹️  Evaluation cancelled by user")