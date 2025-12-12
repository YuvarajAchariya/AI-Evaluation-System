const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create safe filename: timestamp-originalname
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const safeFilename = `answer-${timestamp}-${originalName}`;
        console.log('📁 Saving file as:', safeFilename);
        cb(null, safeFilename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('📄 File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log('❌ Invalid file type:', file.mimetype);
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Upload answer sheets and save to MongoDB - UPDATED WITH 4-DIGIT ID
router.post('/answers', upload.single('file'), async (req, res) => {
    try {
        console.log('=== FILE UPLOAD STARTED ===');
        console.log('📦 Request body:', req.body);
        console.log('📁 Uploaded file:', req.file);
        
        if (!req.file) {
            console.log('❌ No file received');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded or invalid file type'
            });
        }

        // Verify file was saved to disk
        if (!fs.existsSync(req.file.path)) {
            console.log('❌ File not found on disk:', req.file.path);
            return res.status(500).json({
                success: false,
                error: 'File was not saved to server'
            });
        }

        console.log('✅ File saved to disk, creating database record...');

        // Get manual file ID and description from request body
        const { fileId, description } = req.body;
        
        // Validate manual file ID if provided
        if (fileId && !/^\d{4}$/.test(fileId)) {
            return res.status(400).json({
                success: false,
                error: 'File ID must be a 4-digit number (1000-9999)'
            });
        }

        // Check if manual file ID already exists
        if (fileId) {
            const existingFile = await File.findOne({ fileId });
            if (existingFile) {
                return res.status(400).json({
                    success: false,
                    error: `File ID ${fileId} already exists. Please use a different ID.`
                });
            }
        }

        // Create file record in MongoDB
        const fileRecord = new File({
            fileId: fileId, // Will be auto-generated if not provided
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimetype: req.file.mimetype,
            fileType: 'answer_sheet',
            status: 'uploaded',
            description: description || ''
        });

        const savedFile = await fileRecord.save();
        console.log('✅ File saved to database with ID:', savedFile.fileId);
        console.log('📋 File details:', {
            _id: savedFile._id,
            fileId: savedFile.fileId,
            filename: savedFile.filename,
            originalName: savedFile.originalName
        });

        res.json({
            success: true,
            message: 'File uploaded successfully and saved to database!',
            data: {
                id: savedFile._id,
                fileId: savedFile.fileId, // Include the 4-digit ID in response
                filename: savedFile.filename,
                originalName: savedFile.originalName,
                size: savedFile.fileSize,
                mimetype: savedFile.mimetype,
                uploadDate: savedFile.uploadDate,
                downloadUrl: `/api/uploads/${savedFile.filename}`,
                status: savedFile.status,
                description: savedFile.description
            }
        });

        console.log('=== FILE UPLOAD COMPLETED ===');

    } catch (error) {
        console.error('❌ Upload error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'File ID already exists. Please use a different ID.'
            });
        }
        
        // Delete the uploaded file if database save fails
        if (req.file && fs.existsSync(req.file.path)) {
            console.log('🗑️ Deleting file due to error:', req.file.path);
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            error: 'File upload failed: ' + error.message
        });
    }
});

// Get list of uploaded files from MongoDB - UPDATED
router.get('/', async (req, res) => {
    try {
        console.log('📋 Fetching uploaded files list...');
        
        const files = await File.find()
            .sort({ uploadDate: -1 })
            .select('-__v');

        console.log(`✅ Found ${files.length} files`);
        
        // Log file IDs for debugging
        files.forEach((file, index) => {
            console.log(`File ${index + 1}:`, {
                fileId: file.fileId,
                originalName: file.originalName,
                filename: file.filename
            });
        });

        // Add full download URL to each file
        const filesWithUrls = files.map(file => ({
            ...file.toObject(),
            downloadUrl: `/api/uploads/${file.filename}`
        }));

        res.json({
            success: true,
            data: filesWithUrls,
            count: files.length,
            message: 'Uploaded files retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Error fetching files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch uploaded files: ' + error.message
        });
    }
});

// Get file by 4-digit ID
router.get('/id/:fileId', async (req, res) => {
    try {
        const file = await File.findOne({ 
            fileId: req.params.fileId 
        }).select('-__v');

        if (!file) {
            return res.status(404).json({
                success: false,
                error: `File with ID ${req.params.fileId} not found`
            });
        }

        res.json({
            success: true,
            data: {
                ...file.toObject(),
                downloadUrl: `/api/uploads/${file.filename}`
            }
        });
    } catch (error) {
        console.error('Error fetching file by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch file information'
        });
    }
});

// Get specific file info from MongoDB
router.get('/info/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findById(fileId).select('-__v');

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...file.toObject(),
                downloadUrl: `/api/uploads/${file.filename}`
            }
        });
    } catch (error) {
        console.error('Error fetching file info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch file information'
        });
    }
});

// Update file information
router.put('/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const updates = req.body;

        // Prevent updating fileId to maintain consistency
        if (updates.fileId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot update file ID. Please delete and upload a new file instead.'
            });
        }

        const file = await File.findByIdAndUpdate(
            fileId,
            updates,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.json({
            success: true,
            data: file,
            message: 'File updated successfully'
        });
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update file'
        });
    }
});

// Serve uploaded files statically
router.get('/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);
        
        console.log('📥 Serving file:', filename);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.log('❌ File not found:', filePath);
            res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({
            success: false,
            error: 'Error serving file'
        });
    }
});

// Delete uploaded file from both filesystem and MongoDB
router.delete('/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Delete file from filesystem
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
            console.log('🗑️ Deleted file from disk:', file.filePath);
        }

        // Delete record from MongoDB
        await File.findByIdAndDelete(fileId);
        console.log('🗑️ Deleted file record from database. File ID was:', file.fileId);
        
        res.json({
            success: true,
            message: 'File deleted successfully from both storage and database'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete file'
        });
    }
});

// Delete file by 4-digit ID
router.delete('/id/:fileId', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.fileId });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: `File with ID ${req.params.fileId} not found`
            });
        }

        // Delete file from filesystem
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
            console.log('🗑️ Deleted file from disk:', file.filePath);
        }

        // Delete record from MongoDB
        await File.findByIdAndDelete(file._id);
        console.log('🗑️ Deleted file record from database. File ID was:', file.fileId);
        
        res.json({
            success: true,
            message: 'File deleted successfully from both storage and database'
        });
    } catch (error) {
        console.error('Error deleting file by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete file'
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    console.error('Multer error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field. Please use "file" as the field name.'
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