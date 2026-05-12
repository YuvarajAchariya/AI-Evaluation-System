const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const ExtractedAnswer = require('../models/ExtractedAnswer');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const safeFilename = `answer-${timestamp}-${originalName}`;
        cb(null, safeFilename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only text files, PDF, DOC, and DOCX are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

// Improved extraction function
function extractAnswersFromText(content, fileId) {
    console.log('🔍 Extracting answers from text...');
    
    const answers = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`Total lines: ${lines.length}`);
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Line ${i}: "${line.substring(0, 50)}..."`);
        
        // Clean the line - remove extra dots and spaces
        let cleanLine = line.trim();
        
        // Handle patterns like "1.Answer one..java..." -> "1. Answer one. java"
        cleanLine = cleanLine.replace(/(\d+\.)([A-Za-z])/, '$1 $2'); // Add space after number
        cleanLine = cleanLine.replace(/\.\.+/g, '. '); // Replace multiple dots with single dot+space
        cleanLine = cleanLine.replace(/\s+/g, ' '); // Replace multiple spaces with single space
        
        // Extract question number and answer
        const patterns = [
            /^(\d+)\.\s*(.+)$/,          // "1. Answer text"
            /^[Qq](\d+)\.\s*(.+)$/i,      // "Q1. Answer text"
            /^[Qq]uestion\s*(\d+)[:\-\.]\s*(.+)$/i, // "Question 1: Answer"
            /^[Aa]nswer\s*(\d+)[:\-\.]\s*(.+)$/i,   // "Answer 1: text"
            /^(\d+)\)\s*(.+)$/,           // "1) Answer text"
            /^(\d+)[\-\s]+\s*(.+)$/       // "1 - Answer text" or "1 Answer text"
        ];
        
        for (const pattern of patterns) {
            const match = cleanLine.match(pattern);
            if (match) {
                const questionNumber = parseInt(match[1]);
                let answerText = match[2].trim();
                
                // Clean up answer text
                answerText = answerText.replace(/^\.\s*/, ''); // Remove leading dot
                answerText = answerText.replace(/\.\.+/g, '. '); // Fix multiple dots
                
                // Check if answer continues on next lines
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    // Stop if next line starts with a number (next question)
                    if (/^\d+/.test(nextLine)) {
                        break;
                    }
                    // Clean next line and append
                    let cleanNextLine = nextLine.replace(/\.\.+/g, '. ');
                    cleanNextLine = cleanNextLine.replace(/\s+/g, ' ');
                    answerText += ' ' + cleanNextLine;
                    i = j; // Move index forward
                }
                
                // Final cleanup
                answerText = answerText.replace(/\s+/g, ' ').trim();
                
                if (questionNumber >= 1 && questionNumber <= 5 && answerText) {
                    answers.push({
                        questionNumber,
                        answerText,
                        questionId: `${fileId}-${questionNumber}`,
                        cleanAnswer: answerText
                    });
                    console.log(`Found answer ${questionNumber}: ${answerText.substring(0, 50)}...`);
                }
                break;
            }
        }
    }
    
    // If we found fewer than 5 answers, try a simpler approach
    if (answers.length < 5) {
        console.log('Trying simpler extraction...');
        
        // Look for lines that start with numbers 1-5
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Match lines starting with 1-5 followed by dot, space, or nothing
            const match = line.match(/^([1-5])(?:\.|\)|\s|$)(.*)$/);
            if (match) {
                const questionNumber = parseInt(match[1]);
                let answerText = match[2].trim();
                
                // Clean the answer
                answerText = answerText.replace(/^\.\s*/, '');
                answerText = answerText.replace(/\.\.+/g, '. ');
                answerText = answerText.replace(/\s+/g, ' ').trim();
                
                if (answerText) {
                    // Check if we already have this question number
                    const existingIndex = answers.findIndex(a => a.questionNumber === questionNumber);
                    if (existingIndex === -1) {
                        answers.push({
                            questionNumber,
                            answerText,
                            questionId: `${fileId}-${questionNumber}`,
                            cleanAnswer: answerText
                        });
                    }
                }
            }
        }
    }
    
    // Sort by question number
    answers.sort((a, b) => a.questionNumber - b.questionNumber);
    
    console.log(`✅ Found ${answers.length} answers`);
    return answers;
}

// Helper function to save answers to ExtractedAnswer collection
async function saveAnswersToExtractedAnswers(fileData, extractedAnswers) {
    try {
        console.log('💾 Saving answers to extractedanswers collection...');
        
        const savedAnswers = [];
        
        for (const answer of extractedAnswers) {
            const extractedAnswer = new ExtractedAnswer({
                fileId: fileData.fileId,
                fileName: fileData.originalName,
                filePath: fileData.filePath,
                questionId: answer.questionId,
                questionNumber: answer.questionNumber,
                answerText: answer.answerText,
                universalId: `UNIV-${fileData.fileId}`,
                uploadDate: fileData.uploadDate,
                extractionDate: new Date(),
                status: 'extracted'
            });
            
            const saved = await extractedAnswer.save();
            savedAnswers.push(saved);
            console.log(`Saved answer ${answer.questionNumber} with ID: ${saved._id}`);
        }
        
        console.log(`✅ Successfully saved ${savedAnswers.length} answers to extractedanswers`);
        return savedAnswers;
    } catch (error) {
        console.error('❌ Error saving to extractedanswers:', error);
        throw error;
    }
}

// Upload file and extract answers - SAVE TO extractedanswers
router.post('/answers', upload.single('file'), async (req, res) => {
    try {
        console.log('📤 Upload request received');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const { fileId, description, studentId, subject } = req.body;
        
        console.log('File info:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        
        // Validate file ID if provided
        if (fileId && !/^\d{4}$/.test(fileId)) {
            return res.status(400).json({
                success: false,
                error: 'File ID must be a 4-digit number (1000-9999)'
            });
        }

        // Check if file ID exists
        if (fileId) {
            const existingFile = await File.findOne({ fileId });
            if (existingFile) {
                return res.status(400).json({
                    success: false,
                    error: `File ID ${fileId} already exists. Please use a different ID.`
                });
            }
        }

        // Create file record
        const fileRecord = new File({
            fileId: fileId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimetype: req.file.mimetype,
            description: description || '',
            status: 'uploaded',
            studentId: studentId || null,
            subject: subject || null
        });

        const savedFile = await fileRecord.save();
        console.log('✅ File saved to files collection with ID:', savedFile.fileId);

        let extractedAnswers = [];
        let savedExtractedAnswers = [];
        
        // Process text file to extract answers
        if (req.file.mimetype === 'text/plain') {
            try {
                console.log('📖 Reading text file...');
                const fileContent = fs.readFileSync(req.file.path, 'utf-8');
                console.log('File content length:', fileContent.length);
                
                // Extract answers
                extractedAnswers = extractAnswersFromText(fileContent, savedFile.fileId);
                
                console.log('Extracted answers:', JSON.stringify(extractedAnswers, null, 2));
                
                if (extractedAnswers.length > 0) {
                    // Update File collection
                    savedFile.answers = extractedAnswers.map(ans => ({
                        questionId: ans.questionId,
                        questionNumber: ans.questionNumber,
                        answerText: ans.answerText,
                        extractedAt: new Date()
                    }));
                    savedFile.totalAnswers = extractedAnswers.length;
                    savedFile.status = 'processed';
                    savedFile.universalQuestionId = `UNIV-${savedFile.fileId}`;
                    await savedFile.save();
                    
                    // Save to ExtractedAnswer collection
                    savedExtractedAnswers = await saveAnswersToExtractedAnswers(savedFile, extractedAnswers);
                    
                    console.log(`✅ Successfully processed ${extractedAnswers.length} answers`);
                } else {
                    console.log('⚠️ No answers extracted from file');
                    savedFile.status = 'processed';
                    savedFile.totalAnswers = 0;
                    savedFile.universalQuestionId = `UNIV-${savedFile.fileId}`;
                    await savedFile.save();
                }
            } catch (extractError) {
                console.error('❌ Error extracting answers:', extractError);
                savedFile.status = 'error';
                await savedFile.save();
            }
        } else {
            console.log('⚠️ Not a text file, skipping extraction');
        }

        // Get updated file with answers
        const updatedFile = await File.findById(savedFile._id);
        
        res.json({
            success: true,
            message: extractedAnswers.length > 0 
                ? `File uploaded! Extracted ${extractedAnswers.length} answers.` 
                : 'File uploaded but no answers extracted.',
            data: {
                fileId: updatedFile.fileId,
                filename: updatedFile.filename,
                originalName: updatedFile.originalName,
                universalQuestionId: updatedFile.universalQuestionId,
                status: updatedFile.status,
                totalAnswers: updatedFile.totalAnswers,
                answers: updatedFile.answers,
                extractedAnswersCount: savedExtractedAnswers.length,
                uploadDate: updatedFile.uploadDate
            }
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'File ID already exists'
            });
        }
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: 'File upload failed: ' + error.message
        });
    }
});

// Get all extracted answers
router.get('/extracted/all', async (req, res) => {
    try {
        const extractedAnswers = await ExtractedAnswer.find()
            .sort({ extractionDate: -1 })
            .limit(100);

        res.json({
            success: true,
            data: extractedAnswers,
            count: extractedAnswers.length,
            message: 'Extracted answers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get extracted answers by file ID
router.get('/extracted/file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const extractedAnswers = await ExtractedAnswer.find({ fileId })
            .sort({ questionNumber: 1 });

        if (extractedAnswers.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No extracted answers found for this file'
            });
        }

        res.json({
            success: true,
            data: extractedAnswers,
            count: extractedAnswers.length,
            message: 'Extracted answers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get extracted answers by universal ID
router.get('/extracted/universal/:universalId', async (req, res) => {
    try {
        const { universalId } = req.params;
        
        const extractedAnswers = await ExtractedAnswer.find({ universalId })
            .sort({ questionNumber: 1 });

        res.json({
            success: true,
            data: extractedAnswers,
            count: extractedAnswers.length,
            message: 'Extracted answers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get statistics
router.get('/extracted/stats', async (req, res) => {
    try {
        const totalAnswers = await ExtractedAnswer.countDocuments();
        const byStatus = await ExtractedAnswer.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const recentFiles = await ExtractedAnswer.aggregate([
            { $group: { _id: '$fileId', count: { $sum: 1 }, latest: { $max: '$extractionDate' } } },
            { $sort: { latest: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                totalAnswers,
                byStatus,
                recentFiles
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete extracted answers by file ID
router.delete('/extracted/file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const result = await ExtractedAnswer.deleteMany({ fileId });
        
        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} extracted answers for file ${fileId}`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update extracted answer
router.put('/extracted/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const extractedAnswer = await ExtractedAnswer.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!extractedAnswer) {
            return res.status(404).json({
                success: false,
                error: 'Extracted answer not found'
            });
        }

        res.json({
            success: true,
            data: extractedAnswer,
            message: 'Extracted answer updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Bulk update extracted answers status
router.put('/extracted/bulk/status', async (req, res) => {
    try {
        const { fileIds, status } = req.body;
        
        if (!fileIds || !status) {
            return res.status(400).json({
                success: false,
                error: 'fileIds and status are required'
            });
        }

        const result = await ExtractedAnswer.updateMany(
            { fileId: { $in: fileIds } },
            { $set: { status: status } }
        );

        res.json({
            success: true,
            message: `Updated ${result.modifiedCount} extracted answers to status: ${status}`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Keep existing routes for File collection

// ======================================================
// IMPORTANT: These specific routes MUST come before /:fileId
// to prevent Express from treating 'extracted' as a fileId
// ======================================================

router.get('/', async (req, res) => {
    try {
        const files = await File.find()
            .sort({ uploadDate: -1 })
            .select('-__v');

        res.json({
            success: true,
            data: files,
            count: files.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get file by ID
router.get('/:fileId', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.fileId });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.json({
            success: true,
            data: file
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete file and its extracted answers
router.delete('/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Delete extracted answers first
        await ExtractedAnswer.deleteMany({ fileId: file.fileId });
        
        // Delete from filesystem
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // Delete from database
        await File.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'File and all extracted answers deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manual Answer Entry - POST /:fileId/answers/manual
router.post('/:fileId/answers/manual', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 5) {
            return res.status(400).json({
                success: false,
                error: 'Please provide exactly 5 answers'
            });
        }

        const file = await File.findOne({ fileId });
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Build answer objects
        const answerObjects = answers.map((text, index) => ({
            questionId: `${fileId}-${index + 1}`,
            questionNumber: index + 1,
            answerText: text.trim(),
            extractedAt: new Date()
        }));

        // Update File collection
        file.answers = answerObjects;
        file.totalAnswers = 5;
        file.status = 'processed';
        file.universalQuestionId = `UNIV-${fileId}`;
        await file.save();

        // Remove old extracted answers for this file and save new ones
        await ExtractedAnswer.deleteMany({ fileId });
        const extractedObjects = answerObjects.map(a => ({
            fileId: file.fileId,
            fileName: file.originalName,
            filePath: file.filePath,
            questionId: a.questionId,
            questionNumber: a.questionNumber,
            answerText: a.answerText,
            universalId: `UNIV-${fileId}`,
            uploadDate: file.uploadDate,
            extractionDate: new Date(),
            status: 'extracted'
        }));

        const savedExtracted = await ExtractedAnswer.insertMany(extractedObjects);

        console.log(`✅ Saved ${savedExtracted.length} manual answers for file ${fileId}`);

        res.json({
            success: true,
            message: `Saved ${savedExtracted.length} answers manually`,
            data: savedExtracted
        });
    } catch (error) {
        console.error('Manual entry error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get file answers
router.get('/:fileId/answers', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.fileId });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Also get extracted answers from ExtractedAnswer collection
        const extractedAnswers = await ExtractedAnswer.find({ fileId: file.fileId })
            .sort({ questionNumber: 1 });

        res.json({
            success: true,
            data: {
                fileId: file.fileId,
                universalQuestionId: file.universalQuestionId,
                filename: file.filename,
                totalAnswers: file.totalAnswers,
                answers: file.answers,
                extractedAnswers: extractedAnswers,
                status: file.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Re-extract answers from file
router.post('/:fileId/extract', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.fileId });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        console.log('Re-extracting answers from file:', file.fileId);
        
        // Read and extract answers
        const fileContent = fs.readFileSync(file.filePath, 'utf-8');
        const extractedAnswers = extractAnswersFromText(fileContent, file.fileId);
        
        console.log('Re-extracted answers:', extractedAnswers);
        
        // Update File collection
        file.answers = extractedAnswers.map(ans => ({
            questionId: ans.questionId,
            questionNumber: ans.questionNumber,
            answerText: ans.answerText,
            extractedAt: new Date()
        }));
        file.totalAnswers = extractedAnswers.length;
        file.status = 'processed';
        await file.save();
        
        // Update ExtractedAnswer collection (delete old and insert new)
        await ExtractedAnswer.deleteMany({ fileId: file.fileId });
        const savedExtractedAnswers = await saveAnswersToExtractedAnswers(file, extractedAnswers);

        res.json({
            success: true,
            message: `Extracted ${extractedAnswers.length} answers`,
            data: {
                fileAnswers: file.answers,
                extractedAnswers: savedExtractedAnswers
            }
        });
    } catch (error) {
        console.error('Re-extraction error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.use((error, req, res, next) => {
    console.error('Multer error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    next();
});

module.exports = router;