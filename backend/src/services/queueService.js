const { EventEmitter } = require('events');
const { logInfo, logError } = require('../utils/logger');

class QueueService extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.jobHistory = new Map();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Create a new queue
  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = {
      name,
      jobs: [],
      processing: false,
      options: {
        concurrency: options.concurrency || 1,
        maxRetries: options.maxRetries || this.maxRetries,
        retryDelay: options.retryDelay || this.retryDelay,
        ...options
      }
    };

    this.queues.set(name, queue);
    logInfo(`Queue created: ${name}`, queue.options);

    return queue;
  }

  // Add job to queue
  async addJob(queueName, jobData, options = {}) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue not found: ${queueName}`);
      }

      const job = {
        id: this.generateJobId(),
        queue: queueName,
        data: jobData,
        status: 'pending',
        attempts: 0,
        maxAttempts: options.maxAttempts || queue.options.maxRetries,
        delay: options.delay || 0,
        priority: options.priority || 'normal',
        created_at: new Date(),
        scheduled_at: options.delay ? new Date(Date.now() + options.delay) : new Date(),
        ...options
      };

      // Add to queue based on priority
      if (job.priority === 'high') {
        queue.jobs.unshift(job);
      } else {
        queue.jobs.push(job);
      }

      // Store in history
      this.jobHistory.set(job.id, job);

      logInfo(`Job added to queue: ${queueName}`, {
        job_id: job.id,
        priority: job.priority,
        delay: job.delay
      });

      // Emit job added event
      this.emit('job:added', job);

      // Start processing if not already running
      if (!queue.processing) {
        this.processQueue(queueName);
      }

      return {
        success: true,
        job_id: job.id,
        status: 'queued'
      };

    } catch (error) {
      logError(error, `Error adding job to queue: ${queueName}`);
      throw error;
    }
  }

  // Process queue
  async processQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue || queue.processing) {
      return;
    }

    queue.processing = true;
    logInfo(`Started processing queue: ${queueName}`);

    try {
      while (queue.jobs.length > 0) {
        const job = queue.jobs.shift();
        
        if (job.scheduled_at > new Date()) {
          // Job is scheduled for later, put it back
          queue.jobs.unshift(job);
          await this.delay(1000); // Wait 1 second before checking again
          continue;
        }

        await this.processJob(job);
      }
    } finally {
      queue.processing = false;
      logInfo(`Finished processing queue: ${queueName}`);
    }
  }

  // Process single job
  async processJob(job) {
    try {
      job.status = 'processing';
      job.started_at = new Date();
      job.attempts++;

      logInfo(`Processing job: ${job.id}`, {
        queue: job.queue,
        attempt: job.attempts
      });

      // Emit job started event
      this.emit('job:started', job);

      // Execute job handler
      const handler = this.workers.get(job.queue);
      if (!handler) {
        throw new Error(`No handler registered for queue: ${job.queue}`);
      }

      const result = await handler(job.data, job);

      // Job completed successfully
      job.status = 'completed';
      job.completed_at = new Date();
      job.result = result;

      logInfo(`Job completed: ${job.id}`, {
        duration: job.completed_at - job.started_at
      });

      // Emit job completed event
      this.emit('job:completed', job);

    } catch (error) {
      logError(error, `Job failed: ${job.id}`);

      job.status = 'failed';
      job.error = error.message;
      job.failed_at = new Date();

      // Check if job should be retried
      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';
        job.retry_at = new Date(Date.now() + this.calculateRetryDelay(job.attempts));

        // Add back to queue for retry
        const queue = this.queues.get(job.queue);
        if (queue) {
          queue.jobs.unshift(job);
        }

        logInfo(`Job scheduled for retry: ${job.id}`, {
          attempt: job.attempts,
          retry_at: job.retry_at
        });

        // Emit job retry event
        this.emit('job:retry', job);
      } else {
        logError(new Error(`Job failed permanently: ${job.id}`), {
          attempts: job.attempts,
          max_attempts: job.maxAttempts
        });

        // Emit job failed event
        this.emit('job:failed', job);
      }
    }
  }

  // Register job handler
  registerHandler(queueName, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    this.workers.set(queueName, handler);
    logInfo(`Handler registered for queue: ${queueName}`);
  }

  // Get job status
  getJobStatus(jobId) {
    return this.jobHistory.get(jobId) || null;
  }

  // Get queue status
  getQueueStatus(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    const jobs = queue.jobs;
    const status = {
      name: queueName,
      total_jobs: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      retrying: jobs.filter(j => j.status === 'retrying').length,
      completed: Array.from(this.jobHistory.values()).filter(j => j.queue === queueName && j.status === 'completed').length,
      failed: Array.from(this.jobHistory.values()).filter(j => j.queue === queueName && j.status === 'failed').length,
      is_processing: queue.processing
    };

    return status;
  }

  // Get all queues status
  getAllQueuesStatus() {
    const status = {};
    
    for (const [name, queue] of this.queues) {
      status[name] = this.getQueueStatus(name);
    }

    return status;
  }

  // Cancel job
  async cancelJob(jobId) {
    const job = this.jobHistory.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error(`Cannot cancel ${job.status} job`);
    }

    // Remove from queue if still pending
    const queue = this.queues.get(job.queue);
    if (queue) {
      const index = queue.jobs.findIndex(j => j.id === jobId);
      if (index !== -1) {
        queue.jobs.splice(index, 1);
      }
    }

    job.status = 'cancelled';
    job.cancelled_at = new Date();

    logInfo(`Job cancelled: ${jobId}`);

    // Emit job cancelled event
    this.emit('job:cancelled', job);

    return {
      success: true,
      job_id: jobId,
      status: 'cancelled'
    };
  }

  // Clear queue
  clearQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const clearedJobs = queue.jobs.length;
    queue.jobs = [];

    logInfo(`Queue cleared: ${queueName}`, { jobs_cleared: clearedJobs });

    return {
      success: true,
      queue: queueName,
      jobs_cleared: clearedJobs
    };
  }

  // Clear job history
  clearHistory(olderThan = null) {
    let cleared = 0;

    if (olderThan) {
      const cutoff = new Date(Date.now() - olderThan);
      for (const [id, job] of this.jobHistory) {
        if (job.created_at < cutoff) {
          this.jobHistory.delete(id);
          cleared++;
        }
      }
    } else {
      cleared = this.jobHistory.size;
      this.jobHistory.clear();
    }

    logInfo(`Job history cleared`, { jobs_cleared: cleared });

    return {
      success: true,
      jobs_cleared: cleared
    };
  }

  // Calculate retry delay with exponential backoff
  calculateRetryDelay(attempt) {
    return Math.min(this.retryDelay * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate unique job ID
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get system statistics
  getStats() {
    const stats = {
      total_queues: this.queues.size,
      total_jobs: this.jobHistory.size,
      active_workers: this.workers.size,
      queues: this.getAllQueuesStatus()
    };

    return stats;
  }
}

module.exports = new QueueService(); 