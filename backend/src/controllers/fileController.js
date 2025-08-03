const path = require('path');
const fs = require('fs').promises;
const { logError, logInfo } = require('../utils/logger');
const fileUploadService = require('../services/fileUploadService');

class FileController {
  // Upload file
  async uploadFile(req, res) {
    try {
      // File upload is handled by middleware, just return the results
      const uploadedFiles = req.uploadedFiles || [];
      
      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files were uploaded successfully'
        });
      }

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: uploadedFiles
      });

    } catch (error) {
      logError(error, 'Error in file upload controller');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Download file
  async downloadFile(req, res) {
    try {
      const { userId, filePath } = req.params;
      const requestingUserId = req.user.id;

      // Security check: users can only access their own files
      if (requestingUserId !== userId && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const fullPath = path.join(fileUploadService.uploadDir, userId, filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Get file stats
      const stats = await fs.stat(fullPath);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);
      res.setHeader('Content-Length', stats.size);

      // Stream the file
      const fileStream = require('fs').createReadStream(fullPath);
      fileStream.pipe(res);

      logInfo(`File downloaded: ${fullPath} by user: ${requestingUserId}`);

    } catch (error) {
      logError(error, 'Error downloading file');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get file info
  async getFileInfo(req, res) {
    try {
      const { userId, filePath } = req.params;
      const requestingUserId = req.user.id;

      // Security check: users can only access their own files
      if (requestingUserId !== userId && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const fullPath = path.join(fileUploadService.uploadDir, userId, filePath);
      const fileInfo = await fileUploadService.getFileInfo(fullPath);

      if (!fileInfo.exists) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      const fileType = fileUploadService.getFileType(require('mime-types').lookup(fullPath) || '');
      const validation = fileUploadService.validateFileForWhatsApp({
        fileType,
        size: fileInfo.size
      });

      res.json({
        success: true,
        data: {
          filename: path.basename(fullPath),
          path: filePath,
          size: fileInfo.size,
          fileType,
          created: fileInfo.created,
          modified: fileInfo.modified,
          whatsappCompatible: validation.valid,
          validationError: validation.error,
          url: fileUploadService.generateFileUrl(fullPath, userId)
        }
      });

    } catch (error) {
      logError(error, 'Error getting file info');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // List user files
  async listUserFiles(req, res) {
    try {
      const userId = req.user.id;
      const { type, page = 1, limit = 20 } = req.query;

      const userDir = path.join(fileUploadService.uploadDir, userId.toString());
      const files = [];

      try {
        await fs.access(userDir);
      } catch (error) {
        // User has no upload directory yet
        return res.json({
          success: true,
          data: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_items: 0,
            items_per_page: parseInt(limit)
          }
        });
      }

      const processDirectory = async (dirPath, relativePath = '') => {
        try {
          const items = await fs.readdir(dirPath);
          
          for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const itemRelativePath = path.join(relativePath, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
              await processDirectory(itemPath, itemRelativePath);
            } else {
              // Filter by type if specified
              if (type && path.dirname(itemRelativePath) !== type) {
                continue;
              }

              const fileType = fileUploadService.getFileType(require('mime-types').lookup(itemPath) || '');
              const validation = fileUploadService.validateFileForWhatsApp({
                fileType,
                size: stats.size
              });

              files.push({
                filename: item,
                path: itemRelativePath,
                size: stats.size,
                fileType,
                created: stats.birthtime,
                modified: stats.mtime,
                whatsappCompatible: validation.valid,
                validationError: validation.error,
                url: fileUploadService.generateFileUrl(itemPath, userId)
              });
            }
          }
        } catch (error) {
          logError(error, `Error processing directory: ${dirPath}`);
        }
      };

      await processDirectory(userDir);

      // Sort files by modified date (newest first)
      files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedFiles = files.slice(offset, offset + parseInt(limit));
      const totalPages = Math.ceil(files.length / parseInt(limit));

      res.json({
        success: true,
        data: paginatedFiles,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: files.length,
          items_per_page: parseInt(limit)
        }
      });

    } catch (error) {
      logError(error, 'Error listing user files');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { userId, filePath } = req.params;
      const requestingUserId = req.user.id;

      // Security check: users can only delete their own files
      if (requestingUserId !== userId && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const fullPath = path.join(fileUploadService.uploadDir, userId, filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete the file
      const deleted = await fileUploadService.deleteFile(fullPath);

      if (deleted) {
        logInfo(`File deleted: ${fullPath} by user: ${requestingUserId}`);
        
        res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete file'
        });
      }

    } catch (error) {
      logError(error, 'Error deleting file');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get file statistics
  async getFileStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await fileUploadService.getFileStats(userId);

      res.json({
        success: true,
        data: {
          ...stats,
          supportedTypes: fileUploadService.getSupportedFileTypes()
        }
      });

    } catch (error) {
      logError(error, 'Error getting file statistics');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Clean up old files
  async cleanupOldFiles(req, res) {
    try {
      const { days = 7 } = req.query;
      const userId = req.user.id;

      // Only super admins can clean up files
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can perform cleanup.'
        });
      }

      await fileUploadService.cleanupOldFiles(parseInt(days));

      logInfo(`File cleanup initiated by user: ${userId} for files older than ${days} days`);

      res.json({
        success: true,
        message: `Cleanup completed for files older than ${days} days`
      });

    } catch (error) {
      logError(error, 'Error during file cleanup');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get supported file types
  async getSupportedFileTypes(req, res) {
    try {
      const supportedTypes = fileUploadService.getSupportedFileTypes();

      res.json({
        success: true,
        data: supportedTypes
      });

    } catch (error) {
      logError(error, 'Error getting supported file types');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Validate file for WhatsApp
  async validateFileForWhatsApp(req, res) {
    try {
      const { filePath } = req.params;
      const userId = req.user.id;

      const fullPath = path.join(fileUploadService.uploadDir, userId, filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      const stats = await fs.stat(fullPath);
      const fileType = fileUploadService.getFileType(require('mime-types').lookup(fullPath) || '');
      
      const validation = fileUploadService.validateFileForWhatsApp({
        fileType,
        size: stats.size
      });

      res.json({
        success: true,
        data: {
          fileType,
          size: stats.size,
          sizeFormatted: fileUploadService.formatBytes(stats.size),
          valid: validation.valid,
          error: validation.error,
          maxSize: fileUploadService.whatsappLimits[fileType],
          maxSizeFormatted: fileUploadService.formatBytes(fileUploadService.whatsappLimits[fileType] || 0)
        }
      });

    } catch (error) {
      logError(error, 'Error validating file for WhatsApp');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new FileController(); 