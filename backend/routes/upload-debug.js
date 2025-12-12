const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
console.log('📁 Uploads directory path:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
    console.log('🔧 Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
} else {
    console.log('✅ Uploads directory already exists');
}

// List files in uploads directory
try {
    const filesInDir = fs.readdirSync(uploadsDir);
    console.log('📂 Files currently in uploads directory:', filesInDir);
} catch (error) {
    console.log('❌ Cannot read uploads directory:', error.message);
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
        console.log('💾 Saving file as:', safeFilename);
        cb(null, safeFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// GET ALL FILES - WITH COMPLETE DEBUGGING
router.get('/', async (req, res) => {
    console.log('\n=== GET FILES REQUEST STARTED ===');
    
    try {
        console.log('1. Checking database connection...');
        
        // Test database connection
        const db = require('mongoose').connection;
        console.log('📊 Database state:', db.readyState === 1 ? 'Connected' : 'Disconnected');
        
        console.log('2. Querying File collection...');
        const files = await File.find().sort({ uploadDate: -1 }).select('-__v');
        
        console.log('3. Database query result:');
        console.log('   - Files found:', files.length);
        console.log('   - Files data:', JSON.stringify(files, null, 2));
        
        // Check if files exist on disk
        console.log('4. Verifying files on disk...');
        const filesWithVerification = files.map(file => {
            const fileExists = fs.existsSync(file.filePath);
            console.log(`   - ${file.filename}: ${fileExists ? '✅ Exists' : '❌ Missing'}`);
            
            return {
                ...file.toObject(),
                downloadUrl: `/api/uploads/${file.filename}`,
                fileExists: fileExists,
                actualPath: file.filePath
            };
        });

        console.log('5. Sending response...');
        res.json({
            success: true,
            data: filesWithVerification,
            count: files.length,
            debug: {
                uploadsDir: uploadsDir,
                databaseConnected: db.readyState === 1,
                filesOnDisk: filesWithVerification.filter(f => f.fileExists).length
            },
            message: 'Files retrieved successfully'
        });

        console.log('=== GET FILES REQUEST COMPLETED ===\n');

    } catch (error) {
        console.error('❌ GET FILES ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch files: ' + error.message,
            stack: error.stack
        });
    }
});

// UPLOAD FILE
router.post('/answers', upload.single('file'), async (req, res) => {
    console.log('\n=== FILE UPLOAD STARTED ===');
    
    try {
        console.log('1. Checking for uploaded file...');
        console.log('   - Request body:', req.body);
        console.log('   - Uploaded file:', req.file);
        
        if (!req.file) {
            console.log('❌ No file received in request');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('2. Verifying file saved to disk...');
        const fileExists = fs.existsSync(req.file.path);
        console.log('   - File exists on disk:', fileExists);
        console.log('   - File path:', req.file.path);
        console.log('   - File size:', req.file.size, 'bytes');

        if (!fileExists) {
            return res.status(500).json({
                success: false,
                error: 'File was not saved to server storage'
            });
        }

        console.log('3. Creating database record...');
        const fileRecord = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimetype: req.file.mimetype,
            fileType: 'answer_sheet',
            status: 'uploaded'
        });

        console.log('4. Saving to database...');
        const savedFile = await fileRecord.save();
        console.log('   - Database save successful, ID:', savedFile._id);

        console.log('5. Sending success response...');
        res.json({
            success: true,
            message: 'File uploaded successfully!',
            data: {
                id: savedFile._id,
                filename: savedFile.filename,
                originalName: savedFile.originalName,
                size: savedFile.fileSize,
                mimetype: savedFile.mimetype,
                uploadDate: savedFile.uploadDate,
                downloadUrl: `/api/uploads/${savedFile.filename}`,
                filePath: savedFile.filePath
            }
        });

        console.log('=== FILE UPLOAD COMPLETED ===\n');

    } catch (error) {
        console.error('❌ UPLOAD ERROR:', error);
        
        // Clean up file if database save failed
        if (req.file && fs.existsSync(req.file.path)) {
            console.log('🗑️ Deleting file due to error:', req.file.path);
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: 'Upload failed: ' + error.message
        });
    }
});

// MANUAL FILE CHECK ENDPOINT
router.get('/debug/files', async (req, res) => {
    console.log('\n=== MANUAL FILE DEBUG ===');
    
    try {
        // Check database
        const dbFiles = await File.find().sort({ uploadDate: -1 });
        console.log('📊 Database files:', dbFiles.length);
        
        // Check disk
        const diskFiles = fs.readdirSync(uploadsDir);
        console.log('💾 Disk files:', diskFiles.length);
        
        // Compare
        const comparison = dbFiles.map(dbFile => {
            const existsOnDisk = fs.existsSync(dbFile.filePath);
            return {
                filename: dbFile.filename,
                dbId: dbFile._id,
                dbPath: dbFile.filePath,
                existsOnDisk: existsOnDisk,
                diskFiles: diskFiles.includes(dbFile.filename)
            };
        });

        res.json({
            success: true,
            debug: {
                uploadsDirectory: uploadsDir,
                databaseFiles: dbFiles.length,
                diskFiles: diskFiles.length,
                diskFileList: diskFiles,
                comparison: comparison,
                issues: comparison.filter(f => !f.existsOnDisk).length
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// RESET ENDPOINT (for testing)
router.delete('/debug/reset', async (req, res) => {
    try {
        // Delete all files from database
        await File.deleteMany({});
        
        // Delete all files from disk
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
            fs.unlinkSync(path.join(uploadsDir, file));
        });
        
        res.json({
            success: true,
            message: 'All files reset'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;