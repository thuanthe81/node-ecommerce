// Test the EmailEventPublisher directly
const { Queue } = require('bullmq');
const Redis = require('ioredis');

async function testEmailEventPublisher() {
  console.log('=== Testing Email Event Publisher ===\n');

  try {
    // Create Redis connection
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    });

    // Create email queue
    const emailQueue = new Queue('email-events', {
      connection: redis,
    });

    console.log('✅ Connected to Redis and created email queue');

    // Create a test email event
    const testEvent = {
      type: 'ORDER_CONFIRMATION',
      orderId: 'test-order-123',
      locale: 'en',
      timestamp: new Date().toISOString(),
    };

    console.log('📧 Publishing test email event:', testEvent);

    // Add job to queue
    const job = await emailQueue.add('email-event', testEvent, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
      removeOnComplete: 1000,
      removeOnFail: 500,
    });

    console.log(`✅ Email event published successfully! Job ID: ${job.id}`);

    // Wait a moment and check job status
    await new Promise(resolve => setTimeout(resolve, 2000));

    const jobStatus = await job.getState();
    console.log(`📊 Job status: ${jobStatus}`);

    if (jobStatus === 'completed') {
      console.log('✅ Job completed successfully!');
    } else if (jobStatus === 'failed') {
      const failedReason = job.failedReason;
      console.log('❌ Job failed:', failedReason);
    } else {
      console.log(`⏳ Job is still ${jobStatus}`);
    }

    // Clean up
    await redis.quit();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testEmailEventPublisher();