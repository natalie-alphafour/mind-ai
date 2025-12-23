# RAG Chatbot API Documentation

This API allows external applications (like Bubble) to query the RAG chatbot and receive answers with citations.

## Endpoint

```
POST /api/query
```

## Request Format

### Headers
```
Content-Type: application/json
```

### Request Body

```json
{
  "message": "Your question here",
  "temperature": 0.7,
  "model": "gpt-4o",
  "systemPrompt": "You are a helpful assistant specialized in...",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous assistant response"
    }
  ]
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `message` | string | **Yes** | - | The user's question or message |
| `temperature` | number | No | `0.7` | Controls randomness (0.0 - 1.0). Lower = more focused, Higher = more creative |
| `model` | string | No | `"gpt-4o"` | The AI model to use. Options: "gpt-4o", "gpt-4-turbo", "claude-3-5-sonnet" |
| `systemPrompt` | string | No | `""` (empty) | Custom instructions for the AI (overrides default assistant instructions) |
| `conversationHistory` | array | No | `[]` | Previous messages for context (optional) |

#### Default Value Handling

The API intelligently handles empty or invalid values:

- **Empty strings** (`""`) → Uses default value
- **Null** → Uses default value
- **Undefined** → Uses default value
- **Invalid temperature** (e.g., negative, > 1, or non-number) → Uses `0.7`
- **Invalid conversationHistory** (e.g., not an array) → Uses `[]`

This means you can safely leave optional fields empty in Bubble, and the API will use sensible defaults.

**Example:**
```json
{
  "message": "Hello",
  "temperature": "",
  "model": "",
  "systemPrompt": ""
}
```
Will be processed as:
```json
{
  "message": "Hello",
  "temperature": 0.7,
  "model": "gpt-4o",
  "systemPrompt": ""
}
```

**Note about Reranker**: Reranking is configured at the Pinecone Assistant level (when the assistant is created) and cannot be changed per request. If you need different reranking strategies, you'll need to create separate assistants with different configurations.

## Response Format

### Success Response (200 OK)

```json
{
  "answer": "The answer with citation markers like [1] and [2]",
  "citations": [
    {
      "file_name": "document.pdf",
      "score": 1.0,
      "file_id": "file-123",
      "pages": [5, 6],
      "number": 1
    },
    {
      "file_name": "guide.pdf",
      "score": 0.95,
      "file_id": "file-456",
      "pages": [12],
      "number": 2
    }
  ]
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Message is required and must be a non-empty string",
  "answer": "",
  "citations": []
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to process query",
  "answer": "",
  "citations": []
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `answer` | string | The AI-generated answer with citation markers [1], [2], etc. |
| `citations` | array | List of source documents referenced in the answer |
| `citations[].file_name` | string | Name of the source file |
| `citations[].score` | number | Relevance score (0.0 - 1.0) |
| `citations[].file_id` | string | Unique identifier for the file |
| `citations[].pages` | array | Page numbers where information was found |
| `citations[].number` | number | Citation number corresponding to markers in the answer |
| `error` | string | Error message (only present if request failed) |

## Usage Examples

### Example 1: Simple Query

**Request:**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?"
  }'
```

**Response:**
```json
{
  "answer": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed[1]. It focuses on developing algorithms that can analyze data and make predictions[2].",
  "citations": [
    {
      "file_name": "ml-basics.pdf",
      "score": 1.0,
      "file_id": "file-abc123",
      "pages": [1, 2],
      "number": 1
    },
    {
      "file_name": "ai-fundamentals.pdf",
      "score": 0.98,
      "file_id": "file-def456",
      "pages": [15],
      "number": 2
    }
  ]
}
```

### Example 2: Query with Custom Temperature and System Prompt

**Request:**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum computing",
    "temperature": 0.3,
    "model": "gpt-4o",
    "systemPrompt": "You are a quantum physics expert. Explain concepts in simple terms."
  }'
```

### Example 3: Query with Conversation History

**Request:**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain more about that?",
    "temperature": 0.7,
    "conversationHistory": [
      {
        "role": "user",
        "content": "What is neural network?"
      },
      {
        "role": "assistant",
        "content": "A neural network is a computing system inspired by biological neural networks[1]."
      }
    ]
  }'
```

## Bubble.io Integration

### Setting up the API Call in Bubble

1. **Add API Connector Plugin**
   - Go to Plugins → Add plugins → API Connector

2. **Configure the API**
   - Name: RAG Chatbot
   - Authentication: None (or add if needed)

3. **Add API Call**
   - Name: `query_chatbot`
   - Use as: Action
   - Data type: JSON
   - Method: POST
   - URL: `https://your-domain.com/api/query`

4. **Add Parameters**
   - `message` (text, required)
   - `temperature` (number, optional, default: 0.7)
   - `model` (text, optional, default: "gpt-4o")

5. **Initialize Call**
   - Enter test values and click "Initialize call"
   - Bubble will detect the response structure

6. **Use in Workflows**
   ```
   When Button is clicked
   → Plugins → RAG Chatbot - query_chatbot
      message = Input's value
      temperature = Slider's value
      model = Dropdown's value
   → Display results in Text element
      Text element's text = Result of Step 1's answer
   → Display citations in Repeating Group
      Data source = Result of Step 1's citations
   ```

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing rate limiting based on your needs.

## CORS

The API includes CORS headers to allow requests from any origin. Modify the `OPTIONS` handler in the code if you need to restrict access to specific domains.

## Environment Variables

Make sure these environment variables are set:

```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ASSISTANT_NAME=your_assistant_name
```

## Error Handling

Always check the `error` field in the response. If present, the request failed:

```javascript
// Example error handling in JavaScript
fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
})
.then(response => response.json())
.then(data => {
  if (data.error) {
    console.error('Error:', data.error);
    // Handle error
  } else {
    console.log('Answer:', data.answer);
    console.log('Citations:', data.citations);
    // Display results
  }
});
```

## Support

For issues or questions, please refer to the main repository documentation.
