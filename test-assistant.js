// Test script to list Pinecone assistants and get the correct host
const fs = require('fs');
const path = require('path');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

async function listAssistants() {
  const env = loadEnv();
  const apiKey = env.PINECONE_API_KEY;

  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY not found in .env.local');
    return;
  }

  console.log('🔍 Fetching assistants from Pinecone...\n');

  try {
    const response = await fetch('https://api.pinecone.io/assistants', {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();

    if (!data.assistants || data.assistants.length === 0) {
      console.log('⚠️  No assistants found in your Pinecone account');
      return;
    }

    console.log('✅ Found assistants:\n');

    data.assistants.forEach((assistant, index) => {
      console.log(`📋 Assistant #${index + 1}`);
      console.log(`   Name: ${assistant.name}`);
      console.log(`   Status: ${assistant.status}`);
      console.log(`   Host: ${assistant.host}`);
      console.log(`   Created: ${assistant.created_at}`);
      console.log('');
    });

    // Find the mind-ai assistant
    const targetAssistant = data.assistants.find(a => a.name === 'mind-ai');

    if (targetAssistant) {
      console.log('🎯 Your "mind-ai" assistant details:');
      console.log(`   Name: ${targetAssistant.name}`);
      console.log(`   Host: ${targetAssistant.host}`);
      console.log(`   Status: ${targetAssistant.status}`);
      console.log('');
      console.log('✨ Use this endpoint in your code:');
      console.log(`   https://${targetAssistant.host}/chat/${targetAssistant.name}`);
    } else {
      console.log('⚠️  "mind-ai" assistant not found in the list above');
      console.log('   Make sure the name matches exactly (case-sensitive)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAssistants();
