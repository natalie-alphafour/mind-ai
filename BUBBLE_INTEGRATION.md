# Bubble.io Integration Guide

This guide will help you integrate the RAG Chatbot API with your Bubble.io application.

## Quick Start

### 1. Get Your API Endpoint URL

Once deployed, your API endpoint will be:
```
https://your-domain.com/api/query
```

For local testing:
```
http://localhost:3000/api/query
```

### 2. Add API Connector in Bubble

1. Go to your Bubble app
2. Navigate to **Plugins** tab
3. Click **Add plugins**
4. Search and install **API Connector**

### 3. Configure the API

1. Open **API Connector** plugin
2. Click **Add another API**
3. Set **API Name**: `RAG Chatbot`

### 4. Add the API Call

Click **Add another call** and configure:

**Call Name**: `query_chatbot`

**Use as**: Action

**Data type**: JSON

**Method**: POST

**URL**: `https://your-domain.com/api/query`

**Headers** (Add each):
- Key: `Content-Type`, Value: `application/json`

**Body type**: JSON

**Body** (paste this):
```json
{
  "message": "<message>",
  "temperature": <temperature>,
  "model": "<model>",
  "systemPrompt": "<systemPrompt>"
}
```

**Parameters** (Bubble will auto-detect these):
- `message` (text) - Required ✅
- `temperature` (number) - Optional
- `model` (text) - Optional
- `systemPrompt` (text) - Optional

### 5. Initialize the Call

1. Fill in test values:
   - message: "What is machine learning?"
   - temperature: 0.7
   - model: "gpt-4o"
   - systemPrompt: "You are a helpful AI assistant"

2. Click **Initialize call**
3. Bubble will fetch the response and detect the data structure
4. Click **SAVE**

### 6. Important: Default Values

The API uses smart defaults for all optional parameters:

| Parameter | Default | Notes |
|-----------|---------|-------|
| `temperature` | 0.7 | Used if empty, null, or invalid |
| `model` | "gpt-4o" | Used if empty or null |
| `systemPrompt` | "" (empty) | Won't override assistant instructions if empty |
| `conversationHistory` | [] | Used if empty or null |

**This means you can safely leave fields empty in Bubble!** If a user doesn't fill in temperature or model, the API will use sensible defaults automatically.

#### Bubble Tips for Optional Parameters

**Option 1: Send empty values (Recommended - Simpler)**
Just send the values as-is. The API will handle empty values gracefully:
- Empty slider → API uses 0.7
- Empty dropdown → API uses "gpt-4o"
- Empty text input → API uses empty string

**Option 2: Use conditionals (Advanced)**
If you want to completely omit optional parameters:
1. Make parameters "private" in API Connector
2. In workflows, use conditions like:
   - Only set `temperature` when `slider_temperature`'s value is not empty
   - Only set `model` when `dropdown_model`'s value is not empty

Most users should use Option 1 - it's simpler and the API is designed for it!

## Using in Your Bubble App

### Design Your Interface

#### Input Elements
1. **Input** (multiline) - for user message
   - Placeholder: "Ask a question..."
   - ID: `input_message`

2. **Slider** - for temperature (optional)
   - Min value: 0
   - Max value: 1
   - Interval: 0.1
   - Default: 0.7
   - ID: `slider_temperature`

3. **Dropdown** - for model selection (optional)
   - Choices: gpt-4o, gpt-4-turbo, claude-3-5-sonnet
   - Default: gpt-4o
   - ID: `dropdown_model`

4. **Input** (multiline) - for system prompt (optional)
   - Placeholder: "Custom instructions for the AI..."
   - ID: `input_system_prompt`

5. **Button** - to submit
   - Text: "Ask"
   - ID: `button_submit`

#### Output Elements
1. **Text** - for the answer
   - ID: `text_answer`
   - Make multiline
   - Set width/height as needed

2. **Repeating Group** - for citations
   - ID: `repeating_citations`
   - Type of content: text (we'll set this dynamically)
   - Minimum height: 40px

3. **Group** inside Repeating Group with:
   - **Text**: `Current cell's index` (shows citation number)
   - **Text**: `This RAG Chatbot's citations:item #X's file_name`
   - **Text**: `This RAG Chatbot's citations:item #X's pages`

### Create the Workflow

1. **When** `button_submit` is clicked

2. **Step 1**: Show loading state (optional)
   - Element Actions → Show `loading_indicator`

3. **Step 2**: Call the API
   - Plugins → RAG Chatbot - query_chatbot
   - **message** = `input_message`'s value
   - **temperature** = `slider_temperature`'s value
   - **model** = `dropdown_model`'s value
   - **systemPrompt** = `input_system_prompt`'s value

4. **Step 3**: Display the answer
   - Element Actions → Set state
   - Element: `text_answer`
   - Custom state: answer
   - Value: Result of Step 2's answer

5. **Step 4**: Display citations
   - Element Actions → Display list
   - Repeating Group: `repeating_citations`
   - Data source: Result of Step 2's citations

6. **Step 5**: Hide loading state (optional)
   - Element Actions → Hide `loading_indicator`

7. **Step 6**: Clear input
   - Element Actions → Reset inputs
   - Input: `input_message`

### Handle Errors

Add a condition to Step 2:

**When**: Result of Step 2's error is not empty

**Then**:
1. Show alert: Result of Step 2's error
2. Hide loading indicator

## Advanced: Conversation History

To maintain conversation context:

### Setup
1. Create a **Custom Data Type**: `Message`
   - Fields:
     - role (text)
     - content (text)

2. Add a **Custom State** to your page: `conversation_history`
   - Type: Message (list)

### Modified Workflow

**Step 2** becomes:
- Plugins → RAG Chatbot - query_chatbot
- **message** = `input_message`'s value
- **temperature** = `slider_temperature`'s value
- **model** = `dropdown_model`'s value
- **systemPrompt** = `input_system_prompt`'s value
- **conversationHistory** = `Page's conversation_history`:formatted as text
  - In the formatter, convert to JSON:
    ```
    [{"role":"<role>","content":"<content>"}]
    ```

**Step 4a** (before displaying answer): Add user message to history
- Element Actions → Set state
- Element: Page
- Custom state: conversation_history
- Value: Page's conversation_history:plus item (create new Message)
  - role: "user"
  - content: `input_message`'s value

**Step 4b** (after displaying answer): Add assistant response to history
- Element Actions → Set state
- Element: Page
- Custom state: conversation_history
- Value: Page's conversation_history:plus item (create new Message)
  - role: "assistant"
  - content: Result of Step 2's answer

## Displaying Citations with Links

Inside your citations Repeating Group, you can add:

1. **Text** for citation number:
   - Text: `[Current cell's index]`
   - Make bold

2. **Text** for filename:
   - Text: `Current cell's file_name`

3. **Text** for pages:
   - Text: `Pages: Current cell's pages:formatted as text` (join with ", ")
   - Conditional: Show when `Current cell's pages:count > 0`

4. **Text** for relevance:
   - Text: `Relevance: Current cell's score:rounded to 2`%
   - Format as percentage

## Styling Tips

1. **Answer text**: Enable markdown support if needed
2. **Citations**: Use cards or alternating background colors
3. **Loading state**: Add a spinner or skeleton screen
4. **Empty state**: Show placeholder when no answer yet

## Testing in Bubble

1. Click "Preview" in Bubble
2. Type a test question
3. Adjust temperature slider (optional)
4. Select a model (optional)
5. Click "Ask"
6. Verify answer and citations appear

## Troubleshooting

### "API returned empty"
- Check that your server is running
- Verify the API URL is correct
- Check browser console for CORS errors

### "Error: Message is required"
- Make sure input is not empty
- Check that you're passing `input_message`'s value correctly

### "Server configuration error"
- Verify `PINECONE_API_KEY` is set in your environment
- Verify `PINECONE_ASSISTANT_NAME` is set in your environment

### Citations not showing
- Check that Result of Step 2's citations exists
- Verify Repeating Group data source is set correctly
- Check that citation fields match (file_name, pages, etc.)

## Production Deployment

Before deploying to production:

1. Deploy your Next.js app to Vercel, Netlify, or your hosting provider
2. Update the API URL in Bubble to your production URL
3. Consider adding API authentication
4. Set up rate limiting if needed
5. Monitor API usage and costs

## Rate Limiting (Optional)

To prevent abuse, you may want to add rate limiting:

```javascript
// In your app/api/query/route.ts
// Add rate limiting logic or use a library like:
// - Upstash Rate Limit
// - redis-rate-limiter
```

## Support

For issues or questions:
- Check the main API_DOCUMENTATION.md
- Review Bubble's API Connector documentation
- Check your browser console for errors
