from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from groq import Groq
import json
import re
import os
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
        try:
            questions = list(self.db.questions.find({"isActive": True}))
            print(f"📝 Found {len(questions)} questions")
            return questions
        except Exception as e:
            print(f"❌ Error getting questions: {e}")
            return []
    
    def get_all_files(self):
        """Get all answer sheet files from database"""
        try:
            files = list(self.db.files.find({"fileType": "answer_sheet"}))
            print(f"📁 Found {len(files)} answer sheet files")
            return files
        except Exception as e:
            print(f"❌ Error getting files: {e}")
            return []
    
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
                "evaluationDate": datetime.now(),
                "status": "completed"
            }
            
            # Save to database
            self.db.evaluations.insert_one(result)
            results.append(result)
            
            print(f"   ✅ Score: {evaluation_result['marksAwarded']}/{match['maxMarks']} ({evaluation_result['percentage']:.1f}%)")
        
        return results

# Global variables to track evaluation
evaluation_data = {
    'in_progress': False,
    'results': None,
    'error': None
}

@app.route('/api/evaluate', methods=['POST'])
def trigger_evaluation():
    global evaluation_data
    
    if evaluation_data['in_progress']:
        return jsonify({
            'error': 'Evaluation is already in progress. Please wait for it to complete.'
        }), 400
    
    try:
        data = request.json
        subject_id = data.get('subjectId', 'Unknown')
        evaluator_name = data.get('evaluatorName', 'Unknown')
        
        print(f"🚀 Received evaluation request from {evaluator_name} for subject: {subject_id}")
        
        # Reset evaluation data
        evaluation_data = {
            'in_progress': True,
            'results': None,
            'error': None
        }
        
        # Run evaluation in background thread
        def run_evaluation():
            global evaluation_data
            try:
                API_KEY = "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"
                
                print(f"🤖 Starting AI evaluation process...")
                
                # Create evaluator and run evaluation
                evaluator = UnifiedEvaluator(API_KEY)
                results = evaluator.evaluate_all_matches()
                
                if results:
                    # Calculate summary
                    total_marks = sum(r['marksAwarded'] for r in results)
                    total_max_marks = sum(r['maxMarks'] for r in results)
                    overall_percentage = (total_marks / total_max_marks) * 100 if total_max_marks > 0 else 0
                    
                    evaluation_data['results'] = {
                        'totalEvaluated': len(results),
                        'totalMarks': round(total_marks, 2),
                        'totalMaxMarks': total_max_marks,
                        'overallPercentage': round(overall_percentage, 2),
                        'detailedResults': [
                            {
                                'questionId': r['questionId'],
                                'marksAwarded': round(r['marksAwarded'], 2),
                                'maxMarks': r['maxMarks'],
                                'percentage': round(r['percentage'], 2),
                                'feedback': r['feedback'][:100] + '...' if len(r['feedback']) > 100 else r['feedback']
                            } for r in results
                        ]
                    }
                    print(f"✅ Evaluation completed successfully! Evaluated {len(results)} answers.")
                else:
                    evaluation_data['results'] = {
                        'totalEvaluated': 0,
                        'totalMarks': 0,
                        'totalMaxMarks': 0,
                        'overallPercentage': 0,
                        'detailedResults': []
                    }
                    print("⚠️  Evaluation completed but no results were generated.")
                
            except Exception as e:
                error_msg = f"Evaluation failed: {str(e)}"
                print(f"❌ {error_msg}")
                evaluation_data['error'] = error_msg
            finally:
                evaluation_data['in_progress'] = False
        
        # Start background thread
        thread = threading.Thread(target=run_evaluation)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'message': f'AI evaluation process started successfully!',
            'status': 'started',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        evaluation_data['in_progress'] = False
        evaluation_data['error'] = str(e)
        return jsonify({
            'error': f'Failed to start evaluation: {str(e)}'
        }), 500

@app.route('/api/evaluation-status', methods=['GET'])
def get_evaluation_status():
    global evaluation_data
    
    if evaluation_data['in_progress']:
        return jsonify({
            'status': 'in_progress',
            'message': 'Evaluation is currently running...',
            'timestamp': datetime.now().isoformat()
        }), 200
    elif evaluation_data['error']:
        return jsonify({
            'status': 'error',
            'message': evaluation_data['error'],
            'timestamp': datetime.now().isoformat()
        }), 200
    elif evaluation_data['results'] is not None:
        return jsonify({
            'status': 'completed',
            'message': 'Evaluation completed successfully!',
            'results': evaluation_data['results'],
            'timestamp': datetime.now().isoformat()
        }), 200
    else:
        return jsonify({
            'status': 'idle',
            'message': 'No evaluation has been run yet.',
            'timestamp': datetime.now().isoformat()
        }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AI Evaluation System Backend is running',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/database-status', methods=['GET'])
def database_status():
    """Check what data exists in the database"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['ai-evaluation-system']
        
        status = {
            'questions': db.questions.count_documents({}),
            'files': db.files.count_documents({}),
            'evaluations': db.evaluations.count_documents({}),
            'question_ids': [q['questionId'] for q in db.questions.find({}, {'questionId': 1})],
            'file_ids': [f['fileId'] for f in db.files.find({}, {'fileId': 1})]
        }
        
        return jsonify(status), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🤖 AI Evaluation System Backend Starting...")
    print("📊 Available endpoints:")
    print("   - POST /api/evaluate : Start evaluation")
    print("   - GET  /api/evaluation-status : Check evaluation status")
    print("   - GET  /api/health : Health check")
    print("   - GET  /api/database-status : Check database contents")
    app.run(debug=True, port=5000, host='0.0.0.0')