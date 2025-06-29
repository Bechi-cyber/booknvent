// Simple test to check if Metrics model loads
console.log('Starting simple metrics test...');

try {
  const Metrics = require('./models/Metrics');
  console.log('✅ Metrics model loaded successfully');
  
  const metric = new Metrics({
    userId: 1,
    metricType: 'test',
    metricName: 'test_metric',
    metricValue: 100
  });
  
  console.log('✅ Metrics instance created successfully');
  console.log('Metric type:', metric.metricType);
  console.log('Metric name:', metric.metricName);
  console.log('Metric value:', metric.metricValue);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Simple test completed');
