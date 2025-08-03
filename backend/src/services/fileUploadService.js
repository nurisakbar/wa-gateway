const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { logError, logInfo } = require('../utils/logger');

class FileUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024; // 16MB default
    this.allowedMimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/avi', 'video/mov', 'video/3gp'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      archive: ['application/zip', 'application/rar', 'application/7z']
    };
    
    this.whatsappLimits = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024, // 100MB
      archive: 100 * 1024 * 1024 // 100MB
    };
  }

  // Configure multer storage
  configureStorage() {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const userId = req.user.id;
          const userUploadDir = path.join(this.uploadDir, userId.toString());
          
          // Create user upload directory if it doesn't exist
          await fs.mkdir(userUploadDir, { recursive: true });
          
          // Create subdirectories for different file types
          const fileType = this.getFileType(file.mimetype);
          const typeDir = path.join(userUploadDir, fileType);
          await fs.mkdir(typeDir, { recursive: true });
          
          cb(null, typeDir);
        } catch (error) {
          logError(error, 'Error creating upload directory');
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
  }

  // Configure file filter
  configureFileFilter() {
    return (req, file, cb) => {
      try {
        // Check if file type is allowed
        const fileType = this.getFileType(file.mimetype);
        if (!fileType) {
          return cb(new Error('File type not supported'), false);
        }

        // Check file size against WhatsApp limits
        const maxSize = this.whatsappLimits[fileType];
        if (req.file && req.file.size > maxSize) {
          return cb(new Error(`File size exceeds WhatsApp limit for ${fileType} (${this.formatBytes(maxSize)})`), false);
        }

        // Add file type to request for later use
        if (!req.fileTypes) req.fileTypes = [];
        req.fileTypes.push(fileType);

        cb(null, true);
      } catch (error) {
        logError(error, 'Error in file filter');
        cb(error, false);
      }
    };
  }

  // Get file type from MIME type
  getFileType(mimetype) {
    for (const [type, mimeTypes] of Object.entries(this.allowedMimeTypes)) {
      if (mimeTypes.includes(mimetype)) {
        return type;
      }
    }
    return null;
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Create multer instance
  createUploadMiddleware(fieldName = 'file', maxCount = 1) {
    const storage = this.configureStorage();
    const fileFilter = this.configureFileFilter();

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: maxCount
      }
    }).array(fieldName, maxCount);
  }

  // Handle file upload
  async handleFileUpload(req, res, next) {
    try {
      const uploadMiddleware = this.createUploadMiddleware('file', 1);
      
      uploadMiddleware(req, res, async (error) => {
        if (error) {
          logError(error, 'File upload error');
          return res.status(400).json({
            success: false,
            message: error.message || 'File upload failed'
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        const uploadedFiles = [];
        
        for (const file of req.files) {
          try {
            const fileInfo = await this.processUploadedFile(file, req.user.id);
            uploadedFiles.push(fileInfo);
            
            logInfo(`File uploaded: ${fileInfo.filename} by user: ${req.user.id}`);
          } catch (error) {
            logError(error, 'Error processing uploaded file');
            // Continue with other files even if one fails
          }
        }

        req.uploadedFiles = uploadedFiles;
        next();
      });
    } catch (error) {
      logError(error, 'Error in file upload handler');
      res.status(500).json({
        success: false,
        message: 'Internal server error during file upload'
      });
    }
  }

  // Process uploaded file
  async processUploadedFile(file, userId) {
    const fileType = this.getFileType(file.mimetype);
    const fileInfo = {
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      fileType,
      path: file.path,
      userId,
      uploadedAt: new Date(),
      url: this.generateFileUrl(file.path, userId)
    };

    // Validate file size against WhatsApp limits
    const maxSize = this.whatsappLimits[fileType];
    if (file.size > maxSize) {
      throw new Error(`File size (${this.formatBytes(file.size)}) exceeds WhatsApp limit for ${fileType} (${this.formatBytes(maxSize)})`);
    }

    return fileInfo;
  }

  // Generate file URL
  generateFileUrl(filePath, userId) {
    const relativePath = path.relative(this.uploadDir, filePath);
    return `/api/v1/files/${userId}/${relativePath}`;
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { exists: false };
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logInfo(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      logError(error, `Error deleting file: ${filePath}`);
      return false;
    }
  }

  // Clean up old files
  async cleanupOldFiles(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const cleanupDir = async (dirPath) => {
        try {
          const files = await fs.readdir(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
              await cleanupDir(filePath);
            } else if (stats.mtime < cutoffDate) {
              await this.deleteFile(filePath);
            }
          }
        } catch (error) {
          logError(error, `Error cleaning up directory: ${dirPath}`);
        }
      };

      await cleanupDir(this.uploadDir);
      logInfo(`Cleanup completed for files older than ${daysOld} days`);
    } catch (error) {
      logError(error, 'Error during file cleanup');
    }
  }

  // Validate file for WhatsApp
  validateFileForWhatsApp(fileInfo) {
    const { fileType, size } = fileInfo;
    const maxSize = this.whatsappLimits[fileType];
    
    if (!maxSize) {
      return { valid: false, error: 'File type not supported by WhatsApp' };
    }
    
    if (size > maxSize) {
      return { 
        valid: false, 
        error: `File size (${this.formatBytes(size)}) exceeds WhatsApp limit for ${fileType} (${this.formatBytes(maxSize)})` 
      };
    }
    
    return { valid: true };
  }

  // Get file statistics
  async getFileStats(userId) {
    try {
      const userDir = path.join(this.uploadDir, userId.toString());
      const stats = {
        total: 0,
        byType: {},
        totalSize: 0
      };

      const processDirectory = async (dirPath) => {
        try {
          const items = await fs.readdir(dirPath);
          
          for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const itemStats = await fs.stat(itemPath);
            
            if (itemStats.isDirectory()) {
              await processDirectory(itemPath);
            } else {
              stats.total++;
              stats.totalSize += itemStats.size;
              
              const fileType = path.basename(path.dirname(itemPath));
              if (!stats.byType[fileType]) {
                stats.byType[fileType] = { count: 0, size: 0 };
              }
              stats.byType[fileType].count++;
              stats.byType[fileType].size += itemStats.size;
            }
          }
        } catch (error) {
          logError(error, `Error processing directory: ${dirPath}`);
        }
      };

      await processDirectory(userDir);
      return stats;
    } catch (error) {
      logError(error, 'Error getting file statistics');
      return { total: 0, byType: {}, totalSize: 0 };
    }
  }

  // Create thumbnail for image/video
  async createThumbnail(filePath, fileType) {
    // This would require additional libraries like sharp for images
    // and ffmpeg for videos. For now, we'll return the original path
    // TODO: Implement thumbnail generation
    return filePath;
  }

  // Get supported file types
  getSupportedFileTypes() {
    return {
      image: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        mimeTypes: this.allowedMimeTypes.image,
        maxSize: this.whatsappLimits.image
      },
      video: {
        extensions: ['.mp4', '.avi', '.mov', '.3gp'],
        mimeTypes: this.allowedMimeTypes.video,
        maxSize: this.whatsappLimits.video
      },
      audio: {
        extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
        mimeTypes: this.allowedMimeTypes.audio,
        maxSize: this.whatsappLimits.audio
      },
      document: {
        extensions: ['.pdf', '.doc', '.docx', '.txt'],
        mimeTypes: this.allowedMimeTypes.document,
        maxSize: this.whatsappLimits.document
      },
      archive: {
        extensions: ['.zip', '.rar', '.7z'],
        mimeTypes: this.allowedMimeTypes.archive,
        maxSize: this.whatsappLimits.archive
      }
    };
  }
}

module.exports = new FileUploadService(); 