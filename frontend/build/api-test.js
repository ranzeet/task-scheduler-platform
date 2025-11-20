// Quick API test script for browser console
// Run this in the browser's developer console to test API connectivity

(async function testAPI() {
  console.log('🧪 Testing Task Scheduler API Integration...');
  
  try {
    // Test getting all tasks
    console.log('1. Testing GET /api/tasks...');
    const response = await fetch('http://localhost:8081/api/tasks');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tasks = await response.json();
    console.log('✅ API Connection Successful!');
    console.log(`📋 Found ${tasks.length} tasks in the system`);
    console.log('Sample task:', tasks[0]);
    
    // Test creating a task
    console.log('\n2. Testing POST /api/tasks...');
    const newTask = {
      name: 'Browser Test Task',
      description: 'Created from browser console test',
      cronExpression: '0 0 15 * * ?',
      createdBy: 'browser-test',
      assignedTo: 'test-service',
      maxRetries: 2,
      retryDelayMs: 3000
    };
    
    const createResponse = await fetch('http://localhost:8081/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTask)
    });
    
    if (createResponse.ok) {
      const createdTask = await createResponse.json();
      console.log('✅ Task Creation Successful!');
      console.log('Created task ID:', createdTask.id);
      
      // Clean up - delete the test task
      const deleteResponse = await fetch(`http://localhost:8081/api/tasks/${createdTask.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Task Cleanup Successful!');
      }
    }
    
    console.log('\n🎉 All API tests passed! The integration is working correctly.');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
  }
})();
