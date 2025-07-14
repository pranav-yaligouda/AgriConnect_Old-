const os = require('os');
const process = require('process');

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {}
      },
      responseTimes: [],
      errors: {
        total: 0,
        byType: {}
      },
      memory: [],
      cpu: []
    };
    
    this.startTime = Date.now();
    this.maxResponseTimes = 1000; // Keep last 1000 response times
  }

  recordRequest(method, endpoint, statusCode, responseTime) {
    // Update request counts
    this.metrics.requests.total++;
    
    // By method
    this.metrics.requests.byMethod[method] = 
      (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // By endpoint
    this.metrics.requests.byEndpoint[endpoint] = 
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // By status code
    this.metrics.requests.byStatus[statusCode] = 
      (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    
    // Record response time
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > this.maxResponseTimes) {
      this.metrics.responseTimes.shift();
    }
    
    // Record error if status >= 400
    if (statusCode >= 400) {
      this.metrics.errors.total++;
      const errorType = statusCode >= 500 ? 'server' : 'client';
      this.metrics.errors.byType[errorType] = 
        (this.metrics.errors.byType[errorType] || 0) + 1;
    }
  }

  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memory.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    this.metrics.cpu.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // Keep only last 100 system metrics
    if (this.metrics.memory.length > 100) {
      this.metrics.memory.shift();
      this.metrics.cpu.shift();
    }
  }

  getStats() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const p95 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)];
    const p99 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)];
    
    return {
      uptime: Date.now() - this.startTime,
      requests: {
        total: this.metrics.requests.total,
        byMethod: this.metrics.requests.byMethod,
        byEndpoint: this.metrics.requests.byEndpoint,
        byStatus: this.metrics.requests.byStatus
      },
      performance: {
        avgResponseTime,
        p95ResponseTime: p95 || 0,
        p99ResponseTime: p99 || 0,
        minResponseTime: Math.min(...responseTimes) || 0,
        maxResponseTime: Math.max(...responseTimes) || 0
      },
      errors: this.metrics.errors,
      system: {
        memory: this.metrics.memory[this.metrics.memory.length - 1] || {},
        cpu: this.metrics.cpu[this.metrics.cpu.length - 1] || {},
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid
      }
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, byMethod: {}, byEndpoint: {}, byStatus: {} },
      responseTimes: [],
      errors: { total: 0, byType: {} },
      memory: [],
      cpu: []
    };
    this.startTime = Date.now();
  }
}

// Create global monitor instance
const monitor = new PerformanceMonitor();

// Request monitoring middleware
const requestMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Record system metrics every 100 requests
  if (monitor.metrics.requests.total % 100 === 0) {
    monitor.recordSystemMetrics();
  }
  
  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const end = process.hrtime.bigint();
    const responseTime = Number(end - start) / 1000000; // Convert to milliseconds
    
    monitor.recordRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      responseTime
    );
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Health check middleware
const healthCheck = (req, res) => {
  const stats = monitor.getStats();
  const memUsage = process.memoryUsage();
  
  // Calculate memory usage percentage
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  // Determine health status
  const isHealthy = 
    memPercent < 90 && // Memory usage < 90%
    stats.performance.avgResponseTime < 5000 && // Avg response time < 5s
    stats.errors.total / Math.max(stats.requests.total, 1) < 0.1; // Error rate < 10%
  
  const healthStatus = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: stats.uptime,
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round(memPercent * 100) / 100
    },
    performance: {
      avgResponseTime: Math.round(stats.performance.avgResponseTime * 100) / 100,
      errorRate: Math.round((stats.errors.total / Math.max(stats.requests.total, 1)) * 10000) / 100
    },
    system: {
      platform: stats.system.platform,
      nodeVersion: stats.system.nodeVersion,
      pid: stats.system.pid
    }
  };
  
  res.status(isHealthy ? 200 : 503).json(healthStatus);
};

// Metrics endpoint middleware
const metricsEndpoint = (req, res) => {
  const stats = monitor.getStats();
  
  // Format for Prometheus metrics
  const prometheusMetrics = [
    `# HELP http_requests_total Total number of HTTP requests`,
    `# TYPE http_requests_total counter`,
    `http_requests_total{method="total"} ${stats.requests.total}`,
    ...Object.entries(stats.requests.byMethod).map(([method, count]) => 
      `http_requests_total{method="${method}"} ${count}`
    ),
    '',
    `# HELP http_response_time_seconds Response time in seconds`,
    `# TYPE http_response_time_seconds histogram`,
    `http_response_time_seconds{quantile="0.5"} ${stats.performance.avgResponseTime / 1000}`,
    `http_response_time_seconds{quantile="0.95"} ${stats.performance.p95ResponseTime / 1000}`,
    `http_response_time_seconds{quantile="0.99"} ${stats.performance.p99ResponseTime / 1000}`,
    '',
    `# HELP http_errors_total Total number of HTTP errors`,
    `# TYPE http_errors_total counter`,
    `http_errors_total{type="total"} ${stats.errors.total}`,
    ...Object.entries(stats.errors.byType).map(([type, count]) => 
      `http_errors_total{type="${type}"} ${count}`
    ),
    '',
    `# HELP process_memory_bytes Memory usage in bytes`,
    `# TYPE process_memory_bytes gauge`,
    `process_memory_bytes{type="heap_used"} ${stats.system.memory.heapUsed || 0}`,
    `process_memory_bytes{type="heap_total"} ${stats.system.memory.heapTotal || 0}`,
    `process_memory_bytes{type="rss"} ${stats.system.memory.rss || 0}`,
    '',
    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${stats.uptime / 1000}`
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
};

// Performance alerting
const performanceAlerts = (req, res, next) => {
  const stats = monitor.getStats();
  
  // Alert on high error rate
  const errorRate = stats.errors.total / Math.max(stats.requests.total, 1);
  if (errorRate > 0.05) { // 5% error rate
    console.warn(`[ALERT] High error rate detected: ${(errorRate * 100).toFixed(2)}%`);
  }
  
  // Alert on slow response times
  if (stats.performance.avgResponseTime > 2000) { // 2s average
    console.warn(`[ALERT] Slow response times detected: ${stats.performance.avgResponseTime.toFixed(2)}ms average`);
  }
  
  // Alert on high memory usage
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (memPercent > 85) { // 85% memory usage
    console.warn(`[ALERT] High memory usage detected: ${memPercent.toFixed(2)}%`);
  }
  
  next();
};

// Database connection monitoring
const dbConnectionMonitor = (mongoose) => {
  const connection = mongoose.connection;
  
  connection.on('connected', () => {
    console.log('[MONITORING] MongoDB connected');
  });
  
  connection.on('error', (err) => {
    console.error('[MONITORING] MongoDB connection error:', err);
  });
  
  connection.on('disconnected', () => {
    console.warn('[MONITORING] MongoDB disconnected');
  });
  
  // Monitor query performance
  mongoose.set('debug', (collectionName, methodName, ...methodArgs) => {
    console.log(`[DB] ${collectionName}.${methodName}(${methodArgs.join(', ')})`);
  });
};

module.exports = {
  monitor,
  requestMonitor,
  healthCheck,
  metricsEndpoint,
  performanceAlerts,
  dbConnectionMonitor
}; 