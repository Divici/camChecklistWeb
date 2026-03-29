class AiService
  CLAUDE_MODEL = "anthropic/claude-sonnet-4-6-20250514"

  def initialize(checklist)
    @checklist = checklist
    @items = checklist.items.order(:position)
  end

  # Process voice transcript — match to checklist items and check them off
  def process_voice(transcript)
    response = call_claude(
      messages: [{ role: "user", content: transcript }],
      tools: [check_items_tool]
    )
    handle_tool_response(response, "voice")
  end

  # Process photo — send image to Claude vision to match checklist items
  def process_photo(image_data, content_type)
    response = call_claude(
      messages: [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: "data:#{content_type};base64,#{image_data}"
            }
          },
          { type: "text", text: "What checklist items can you see completed in this image?" }
        ]
      }],
      tools: [check_items_tool]
    )
    handle_tool_response(response, "photo")
  end

  # Answer a question about the checklist
  def answer_question(question)
    response = call_claude(
      messages: [{ role: "user", content: question }],
      tools: [answer_question_tool]
    )
    handle_answer_response(response)
  end

  private

  def system_prompt
    items_text = @items.map { |item|
      status = item.completed? ? "[DONE]" : "[TODO]"
      "#{status} ID:#{item.id} - #{item.text} (priority: #{item.priority})"
    }.join("\n")

    <<~PROMPT
      You are CheckVoice, an AI assistant that helps users manage checklists.
      You have access to tools to check off items and answer questions.

      Current checklist: #{@checklist.name}
      #{@checklist.description.present? ? "Description: #{@checklist.description}" : ""}

      Items:
      #{items_text}

      When matching voice input to items, be generous — "just got out of the carwash" should match "Wash Car".
      When matching photos, identify what's been completed based on visual evidence.
      Only mark items as complete if there's a reasonable match. Return empty array if nothing matches.
    PROMPT
  end

  def check_items_tool
    {
      type: "function",
      function: {
        name: "check_items",
        description: "Mark checklist items as complete based on what the user described or showed in a photo.",
        parameters: {
          type: "object",
          properties: {
            item_ids: {
              type: "array",
              items: { type: "integer" },
              description: "Array of item IDs to mark as complete"
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of why these items were matched"
            }
          },
          required: ["item_ids", "reasoning"]
        }
      }
    }
  end

  def answer_question_tool
    {
      type: "function",
      function: {
        name: "answer_question",
        description: "Answer a question about the user's checklist progress.",
        parameters: {
          type: "object",
          properties: {
            answer: {
              type: "string",
              description: "The answer to the user's question"
            },
            related_item_ids: {
              type: "array",
              items: { type: "integer" },
              description: "IDs of items relevant to the answer"
            }
          },
          required: ["answer"]
        }
      }
    }
  end

  def openrouter_client
    @openrouter_client ||= OpenAI::Client.new(
      access_token: ENV.fetch("OPENROUTER_API_KEY"),
      uri_base: "https://openrouter.ai/api/v1",
      log_errors: true,
      extra_headers: {
        "HTTP-Referer" => ENV.fetch("FRONTEND_URL", "http://localhost:3000"),
        "X-Title" => "CheckVoice"
      }
    )
  end

  def call_claude(messages:, tools:)
    start_time = Time.current
    response = openrouter_client.chat(
      parameters: {
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system_prompt },
          *messages
        ],
        tools: tools,
        tool_choice: "auto"
      }
    )
    duration = Time.current - start_time

    # Check for API errors
    if response.is_a?(Hash) && response["error"]
      error_msg = response.dig("error", "message") || response["error"].to_s
      Rails.logger.error("OpenRouter API error: #{error_msg}")
      raise "AI service error: #{error_msg}"
    end

    # Log to Langfuse if available
    log_to_langfuse(messages, tools, response, duration) if langfuse_configured?

    response
  end

  def handle_tool_response(response, completed_via)
    message = response.dig("choices", 0, "message")
    tool_calls = message&.dig("tool_calls") || []
    tool_call = tool_calls.find { |tc| tc.dig("function", "name") == "check_items" }

    return { checked_items: [], reasoning: "No items matched" } unless tool_call

    input = JSON.parse(tool_call.dig("function", "arguments"))
    item_ids = input["item_ids"] || []
    reasoning = input["reasoning"] || ""

    # Mark items as completed (wrapped in transaction for atomicity)
    checked_items = []
    ActiveRecord::Base.transaction do
      item_ids.each do |id|
        item = @items.find { |i| i.id == id }
        next unless item && !item.completed?

        item.update!(completed: true, completed_via: completed_via, completed_at: Time.current)
        checked_items << item
      end
    end

    { checked_items: checked_items.map(&:as_json), reasoning: reasoning }
  end

  def handle_answer_response(response)
    message = response.dig("choices", 0, "message")
    tool_calls = message&.dig("tool_calls") || []
    tool_call = tool_calls.find { |tc| tc.dig("function", "name") == "answer_question" }

    if tool_call
      input = JSON.parse(tool_call.dig("function", "arguments"))
      answer = input["answer"]
      related_ids = input["related_item_ids"] || []
      related_items = @items.select { |i| related_ids.include?(i.id) }
      { answer: answer, related_items: related_items.map(&:as_json) }
    else
      # Fall back to text response
      text = message&.dig("content") || "I couldn't process that question."
      { answer: text, related_items: [] }
    end
  end

  def langfuse_configured?
    ENV["LANGFUSE_PUBLIC_KEY"].present? && ENV["LANGFUSE_SECRET_KEY"].present?
  end

  def log_to_langfuse(messages, tools, response, duration)
    Langfuse.configure do |config|
      config.public_key = ENV["LANGFUSE_PUBLIC_KEY"]
      config.secret_key = ENV["LANGFUSE_SECRET_KEY"]
      config.host = ENV.fetch("LANGFUSE_HOST", "https://cloud.langfuse.com")
    end

    trace = Langfuse.trace(
      name: "checkvoice-ai",
      metadata: {
        checklist_id: @checklist.id,
        checklist_name: @checklist.name,
        item_count: @items.size
      }
    )

    usage = response.dig("usage") || {}
    Langfuse.generation(
      trace_id: trace.id,
      name: "claude-tool-use",
      model: CLAUDE_MODEL,
      input: messages,
      output: response.dig("choices", 0, "message"),
      usage: {
        input_tokens: usage["prompt_tokens"],
        output_tokens: usage["completion_tokens"]
      },
      metadata: { duration_ms: (duration * 1000).round }
    )

    Langfuse.flush
  rescue => e
    Rails.logger.warn("Langfuse logging failed: #{e.message}")
  end
end
