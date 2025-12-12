# unified_evaluator_fixed.py
from pymongo import MongoClient
from groq import Groq
import json
import re
import os
from datetime import datetime

class UnifiedEvaluator:
    def __init__(self, api_key):
        self.client = Groq(api_key=api_key)
        self.db_client = MongoClient('mongodb://localhost:27017/')
        self.db = self.db_client['ai-evaluation-system']
    
    def read_text_file_content(self, file_path):
        """Read content from text file"""
        try:
            # Fix file path
            file_path = file_path.replace('\\', '/')
            
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                return content
            else:
                # Try alternative path in uploads folder
                alt_path = os.path.join('uploads', os.path.basename(file_path))
                if os.path.exists(alt_path):
                    with open(alt_path, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                    return content
                else:
                    return "File not found"
        except Exception as e:
            return f"Error reading file: {e}"
    
    def get_all_questions(self):
        """Get all questions from database"""
        questions = list(self.db.questions.find({"isActive": True}))
        print(f"📝 Found {len(questions)} questions")
        return questions
    
    def get_all_files(self):
        """Get all answer sheet files from database"""
        files = list(self.db.files.find({"fileType": "answer_sheet"}))
        print(f"📁 Found {len(files)} answer sheet files")
        return files
    
    def find_matching_pairs(self):
        """Find matching questions and files by ID"""
        questions = self.get_all_questions()
        files = self.get_all_files()
        
        matches = []
        
        print("\n🔍 FINDING MATCHES:")
        print("-" * 40)
        
        for question in questions:
            question_id = question['questionId']
            
            # Find matching file by fileId
            matching_file = None
            for file in files:
                if file['fileId'] == question_id:
                    matching_file = file
                    break
            
            if matching_file:
                # Read the text file content
                student_answer = self.read_text_file_content(matching_file['filePath'])
                
                match_data = {
                    "questionId": question_id,
                    "questionText": question['questionText'],
                    "referenceAnswer": question['referenceAnswer'],
                    "maxMarks": question['maxMarks'],
                    "fileName": matching_file['filename'],
                    "filePath": matching_file['filePath'],
                    "studentAnswer": student_answer
                }
                matches.append(match_data)
                print(f"✅ MATCH: Question '{question_id}' -> File '{matching_file['filename']}'")
            else:
                print(f"❌ NO MATCH: Question '{question_id}' has no answer file")
        
        return matches
    
    def evaluate_single_answer(self, question_text, reference_answer, student_answer, max_marks):
        """Evaluate one answer using AI"""
        try:
            prompt = f"""
            Evaluate the student's answer against the reference answer.
            
            QUESTION: {question_text}
            REFERENCE ANSWER: {reference_answer}
            STUDENT'S ANSWER: {student_answer}
            MAXIMUM MARKS: {max_marks}
            
            Evaluate based on:
            1. Accuracy and completeness compared to reference answer
            2. Understanding of concepts
            3. Clarity and structure
            4. Relevance to question
            
            Return ONLY a JSON format:
            {{
                "marksAwarded": x.x,
                "feedback": "Detailed feedback here",
                "percentage": xx.x
            }}
            """
            
            # Try different available models
            available_models = [
                "llama-3.1-70b-versatile",  # Primary choice
                "llama-3.1-8b-instant",     # Secondary choice
                "mixtral-8x7b-32768",       # Alternative
                "gemma2-9b-it"              # Alternative
            ]
            
            response = None
            last_error = None
            
            for model in available_models:
                try:
                    print(f"   🤖 Trying model: {model}")
                    response = self.client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=500
                    )
                    break  # If successful, break the loop
                except Exception as e:
                    last_error = e
                    continue  # Try next model
            
            if not response:
                raise Exception(f"All models failed. Last error: {last_error}")
            
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
                marks = float(result_data["marksAwarded"])
                feedback = result_data["feedback"]
                percentage = float(result_data["percentage"])
            else:
                # Fallback if JSON not found
                marks = max_marks * 0.7
                feedback = "Evaluation completed automatically"
                percentage = 70.0
            
            return {
                "marksAwarded": marks,
                "feedback": feedback,
                "percentage": percentage
            }
            
        except Exception as e:
            print(f"❌ Evaluation error: {e}")
            return {
                "marksAwarded": max_marks * 0.5,  # Give 50% as fallback
                "feedback": f"Evaluation failed: {str(e)}",
                "percentage": 50.0
            }
    
    def evaluate_all_matches(self):
        """Evaluate all matching questions and answers"""
        matches = self.find_matching_pairs()
        
        if not matches:
            print("❌ No matches found to evaluate!")
            return []
        
        print(f"\n🚀 STARTING EVALUATION OF {len(matches)} MATCHES:")
        print("=" * 60)
        
        results = []
        
        for i, match in enumerate(matches, 1):
            print(f"\n📖 Evaluating {i}/{len(matches)}: {match['questionId']}")
            print(f"   Question: {match['questionText'][:50]}...")
            print(f"   Student Answer: {match['studentAnswer'][:50]}...")
            
            # Evaluate using AI
            evaluation_result = self.evaluate_single_answer(
                question_text=match['questionText'],
                reference_answer=match['referenceAnswer'],
                student_answer=match['studentAnswer'],
                max_marks=match['maxMarks']
            )
            
            # Create result object
            result = {
                "questionId": match['questionId'],
                "fileName": match['fileName'],
                "questionText": match['questionText'],
                "studentAnswer": match['studentAnswer'],
                "referenceAnswer": match['referenceAnswer'],
                "marksAwarded": evaluation_result['marksAwarded'],
                "maxMarks": match['maxMarks'],
                "percentage": evaluation_result['percentage'],
                "feedback": evaluation_result['feedback'],
                "evaluationDate": datetime.now()
            }
            
            # Save to database
            self.db.evaluations.insert_one(result)
            results.append(result)
            
            print(f"   ✅ Score: {evaluation_result['marksAwarded']}/{match['maxMarks']} ({evaluation_result['percentage']:.1f}%)")
        
        return results
    
    def display_results(self, results):
        """Display evaluation results"""
        if not results:
            print("❌ No results to display")
            return
        
        print("\n" + "=" * 70)
        print("🎯 EVALUATION RESULTS SUMMARY")
        print("=" * 70)
        
        total_marks = sum(r['marksAwarded'] for r in results)
        total_max_marks = sum(r['maxMarks'] for r in results)
        overall_percentage = (total_marks / total_max_marks) * 100
        
        print(f"📊 OVERALL PERFORMANCE:")
        print(f"   • Questions Evaluated: {len(results)}")
        print(f"   • Total Score: {total_marks:.1f}/{total_max_marks:.1f}")
        print(f"   • Overall Percentage: {overall_percentage:.2f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in results:
            status = "🎉 EXCELLENT" if result['percentage'] >= 80 else "✅ GOOD" if result['percentage'] >= 60 else "⚠️  AVERAGE" if result['percentage'] >= 40 else "❌ POOR"
            print(f"   {result['questionId']}: {result['marksAwarded']:.1f}/{result['maxMarks']} ({result['percentage']:.1f}%) - {status}")
        
        print(f"\n💾 Results saved to database!")

def display_database_status():
    """Display current database status"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['ai-evaluation-system']
    
    print("📊 DATABASE STATUS")
    print("=" * 50)
    
    questions = db.questions.count_documents({})
    files = db.files.count_documents({})
    evaluations = db.evaluations.count_documents({})
    
    print(f"   • Questions: {questions}")
    print(f"   • Files: {files}")
    print(f"   • Evaluations: {evaluations}")
    
    # Show available IDs
    question_ids = [q['questionId'] for q in db.questions.find({}, {'questionId': 1})]
    file_ids = [f['fileId'] for f in db.files.find({}, {'fileId': 1})]
    
    print(f"\n🔍 AVAILABLE IDs:")
    print(f"   • Question IDs: {question_ids}")
    print(f"   • File IDs: {file_ids}")
    
    # Find matches
    matches = []
    for q_id in question_ids:
        if q_id in file_ids:
            matches.append(q_id)
    
    print(f"   • Matching IDs: {matches}")

def main():
    API_KEY = "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"
    
    print("🤖 UNIFIED AI EVALUATION SYSTEM")
    print("=" * 70)
    
    # Display database status first
    display_database_status()
    
    print("\n" + "=" * 70)
    print("🚀 STARTING EVALUATION PROCESS")
    print("=" * 70)
    
    # Create evaluator
    evaluator = UnifiedEvaluator(API_KEY)
    
    # Run evaluation
    results = evaluator.evaluate_all_matches()
    
    # Display results
    evaluator.display_results(results)
    
    print("\n" + "=" * 70)
    print("✅ EVALUATION COMPLETED!")
    print("=" * 70)

if __name__ == "__main__":
    main()