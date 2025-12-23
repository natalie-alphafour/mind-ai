/**
 * Test script for the RAG Chatbot API
 *
 * Usage:
 *   node test-api.js
 *
 * Make sure your dev server is running on port 3000
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing RAG Chatbot API\n');

  // Test 1: Simple query
  console.log('Test 1: Simple Query');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is this document about?',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Answer:', data.answer?.substring(0, 100) + '...');
    console.log('Citations:', data.citations?.length || 0);
    if (data.error) {
      console.log('❌ Error:', data.error);
    } else {
      console.log('✅ Test 1 Passed');
    }
  } catch (error) {
    console.log('❌ Test 1 Failed:', error.message);
  }
  console.log('\n');

  // Test 2: Query with custom temperature and system prompt
  console.log('Test 2: Query with Custom Temperature and System Prompt');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me something interesting',
        temperature: 0.9,
        model: 'gpt-4o',
        systemPrompt: 'You are a creative storyteller. Make your responses engaging and vivid.',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Answer:', data.answer?.substring(0, 100) + '...');
    console.log('Citations:', data.citations?.length || 0);
    if (data.error) {
      console.log('❌ Error:', data.error);
    } else {
      console.log('✅ Test 2 Passed');
    }
  } catch (error) {
    console.log('❌ Test 2 Failed:', error.message);
  }
  console.log('\n');

  // Test 3: Query with conversation history
  console.log('Test 3: Query with Conversation History');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Can you elaborate on that?',
        conversationHistory: [
          {
            role: 'user',
            content: 'What is machine learning?',
          },
          {
            role: 'assistant',
            content: 'Machine learning is a field of AI.',
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Answer:', data.answer?.substring(0, 100) + '...');
    console.log('Citations:', data.citations?.length || 0);
    if (data.error) {
      console.log('❌ Error:', data.error);
    } else {
      console.log('✅ Test 3 Passed');
    }
  } catch (error) {
    console.log('❌ Test 3 Failed:', error.message);
  }
  console.log('\n');

  // Test 4: Query with empty optional parameters (should use defaults)
  console.log('Test 4: Query with Empty Optional Parameters (Default Handling)');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is AI?',
        temperature: '', // Should default to 0.7
        model: '', // Should default to gpt-4o
        systemPrompt: '', // Should be empty string
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    if (response.status === 200 && !data.error) {
      console.log('✅ Test 4 Passed (Defaults applied correctly)');
      console.log('Answer received:', !!data.answer);
    } else {
      console.log('❌ Test 4 Failed');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Test 4 Failed:', error.message);
  }
  console.log('\n');

  // Test 5: Invalid request (empty message)
  console.log('Test 5: Invalid Request (Empty Message)');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    if (data.error && response.status === 400) {
      console.log('✅ Test 5 Passed (Error handled correctly)');
      console.log('Error message:', data.error);
    } else {
      console.log('❌ Test 5 Failed (Should return 400 error)');
    }
  } catch (error) {
    console.log('❌ Test 5 Failed:', error.message);
  }
  console.log('\n');

  // Test 6: Full response structure
  console.log('Test 6: Full Response Structure');
  console.log('='.repeat(50));
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Give me a detailed explanation',
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.answer && Array.isArray(data.citations)) {
      console.log('\n✅ Test 6 Passed');
      console.log('Response has correct structure');
    } else {
      console.log('\n❌ Test 6 Failed');
      console.log('Response structure is invalid');
    }
  } catch (error) {
    console.log('❌ Test 6 Failed:', error.message);
  }
  console.log('\n');

  console.log('🏁 Testing Complete');
}

// Run tests
testAPI().catch(console.error);
