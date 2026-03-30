class AiService
  CLAUDE_MODEL = "anthropic/claude-sonnet-4.6"

  def initialize(checklist)
    @checklist = checklist
    @items = checklist.items.order(:position)
  end

  # Process voice transcript — match to checklist items, check off or delete
  def process_voice(transcript)
    response = call_claude(
      messages: [{ role: "user", content: transcript }],
      tools: [check_items_tool, delete_items_tool],
      system_override: voice_system_prompt
    )
    handle_voice_response(response)
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

  # Full assistant — answers questions AND performs actions across all projects
  def assistant_ask(question)
    all_tools = [
      answer_question_tool,
      add_item_tool,
      edit_item_tool,
      delete_item_tool,
      toggle_item_tool,
      switch_context_tool,
    ]
    response = call_claude(
      messages: [{ role: "user", content: question }],
      tools: all_tools,
      system_override: assistant_system_prompt
    )
    handle_assistant_response(response)
  end

  # Legacy ask — just answers questions about current checklist
  def answer_question(question)
    response = call_claude(
      messages: [{ role: "user", content: question }],
      tools: [answer_question_tool]
    )
    handle_answer_response(response)
  end

  private

  def voice_system_prompt
    items_text = @items.map { |item|
      status = item.completed? ? "[DONE]" : "[TODO]"
      "#{status} ID:#{item.id} - #{item.text} (priority: #{item.priority})"
    }.join("\n")

    <<~PROMPT
      You are CamChecklist, an AI assistant that helps users manage checklists via voice.

      Current checklist: #{@checklist.name}
      #{@checklist.description.present? ? "Description: #{@checklist.description}" : ""}

      Items:
      #{items_text}

      You have two tools: check_items (mark as complete) and delete_items (remove from list).

      CRITICAL RULES for choosing the right tool:
      - "remove", "delete", "take off", "get rid of" = use delete_items to REMOVE the item from the list entirely.
      - "done", "finished", "completed", "just did" = use check_items to MARK as complete.
      - When matching voice input to items, be generous — "just got out of the carwash" should match "Wash Car".
      - Only act on items that have a reasonable match. Return empty arrays if nothing matches.
    PROMPT
  end

  def system_prompt
    items_text = @items.map { |item|
      status = item.completed? ? "[DONE]" : "[TODO]"
      "#{status} ID:#{item.id} - #{item.text} (priority: #{item.priority})"
    }.join("\n")

    <<~PROMPT
      You are CamChecklist, an AI assistant that helps users manage checklists.
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

  def assistant_system_prompt
    current_items_text = @items.map { |item|
      status = item.completed? ? "[DONE]" : "[TODO]"
      "  #{status} ID:#{item.id} - #{item.text} (priority: #{item.priority})"
    }.join("\n")

    # Load all projects and their checklists for cross-project awareness
    other_context_lines = []
    @checklist.project.user&.projects&.includes(checklists: :items)&.find_each do |project|
      project.checklists.each do |cl|
        next if cl.id == @checklist.id
        items_summary = cl.items.order(:position).map { |item|
          status = item.completed? ? "[DONE]" : "[TODO]"
          "    #{status} ID:#{item.id} - #{item.text}"
        }.join("\n")
        other_context_lines << "  Project: \"#{project.name}\" (ID:#{project.id}) > Checklist: \"#{cl.name}\" (ID:#{cl.id})\n#{items_summary}"
      end
    end

    <<~PROMPT
      You are CamChecklist, a smart AI assistant for managing checklists.
      You can answer questions, add items, edit items, delete items, toggle completion, and help users navigate between projects and checklists.

      == CURRENT CONTEXT ==
      Project: "#{@checklist.project.name}" (ID:#{@checklist.project.id})
      Checklist: "#{@checklist.name}" (ID:#{@checklist.id})
      #{@checklist.description.present? ? "Description: #{@checklist.description}" : ""}
      Items:
      #{current_items_text}

      == OTHER PROJECTS & CHECKLISTS ==
      #{other_context_lines.any? ? other_context_lines.join("\n\n") : "(none)"}

      == RULES ==
      - Always use the answer_question tool to respond to the user, even when performing actions. Combine your answer with any actions.
      - IMPORTANT: Write plain text only in the answer field. No markdown, no **, no *, no bullet symbols, no numbered lists with formatting. Just plain sentences. The UI renders items as visual cards — never list items as text in your answer.
      - When the user asks to see or list items, keep your text answer short (e.g. "Here are the tasks in [checklist name] in [project name].") and put ALL the relevant item IDs in the related_item_ids array. The UI will render them as cards. Do NOT list items in the answer text.
      - When the user mentions something that clearly belongs to a DIFFERENT project or checklist, use the switch_context tool to suggest switching. Ask them to confirm first before taking actions on items in other checklists.
      - BEFORE adding an item, check if it fits the current checklist's theme/purpose. If the item clearly belongs to a DIFFERENT checklist (e.g. adding "meeting with client" to a laundry list when a client-related checklist exists), do NOT add it. Instead use switch_context to suggest the correct checklist, and explain why in your answer. Only add the item if the user confirms or if it genuinely fits the current checklist.
      - When adding items, use sensible defaults (priority: "normal") unless specified.
      - When toggling items, set completed=true to check off, completed=false to uncheck.
      - You may call multiple tools in one response (e.g. add an item AND answer).
    PROMPT
  end

  # ── Tool definitions ──

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

  def delete_items_tool
    {
      type: "function",
      function: {
        name: "delete_items",
        description: "Remove/delete items from the checklist entirely. Use when the user says remove, delete, take off, or get rid of.",
        parameters: {
          type: "object",
          properties: {
            item_ids: {
              type: "array",
              items: { type: "integer" },
              description: "Array of item IDs to delete"
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of why these items were matched for deletion"
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
        description: "Answer the user's question or confirm an action was taken. Always use this tool to respond.",
        parameters: {
          type: "object",
          properties: {
            answer: {
              type: "string",
              description: "The response to show the user"
            },
            related_item_ids: {
              type: "array",
              items: { type: "integer" },
              description: "IDs of items relevant to the answer (from the current checklist)"
            }
          },
          required: ["answer"]
        }
      }
    }
  end

  def add_item_tool
    {
      type: "function",
      function: {
        name: "add_item",
        description: "Add a new item to the current checklist.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "The item text" },
            priority: { type: "string", enum: ["low", "normal", "high"], description: "Priority level (default: normal)" }
          },
          required: ["text"]
        }
      }
    }
  end

  def edit_item_tool
    {
      type: "function",
      function: {
        name: "edit_item",
        description: "Edit an existing item's text or priority on the current checklist.",
        parameters: {
          type: "object",
          properties: {
            item_id: { type: "integer", description: "The ID of the item to edit" },
            text: { type: "string", description: "New text for the item (omit to keep current)" },
            priority: { type: "string", enum: ["low", "normal", "high"], description: "New priority (omit to keep current)" }
          },
          required: ["item_id"]
        }
      }
    }
  end

  def delete_item_tool
    {
      type: "function",
      function: {
        name: "delete_item",
        description: "Delete an item from the current checklist.",
        parameters: {
          type: "object",
          properties: {
            item_id: { type: "integer", description: "The ID of the item to delete" }
          },
          required: ["item_id"]
        }
      }
    }
  end

  def toggle_item_tool
    {
      type: "function",
      function: {
        name: "toggle_item",
        description: "Mark an item as complete or incomplete on the current checklist.",
        parameters: {
          type: "object",
          properties: {
            item_id: { type: "integer", description: "The ID of the item to toggle" },
            completed: { type: "boolean", description: "true to mark complete, false to uncheck" }
          },
          required: ["item_id", "completed"]
        }
      }
    }
  end

  def switch_context_tool
    {
      type: "function",
      function: {
        name: "switch_context",
        description: "Suggest switching to a different project and/or checklist when the user references items outside the current context.",
        parameters: {
          type: "object",
          properties: {
            project_id: { type: "integer", description: "The project ID to switch to" },
            checklist_id: { type: "integer", description: "The checklist ID to switch to" },
            reason: { type: "string", description: "Why you're suggesting this switch" }
          },
          required: ["project_id", "checklist_id", "reason"]
        }
      }
    }
  end

  # ── Client & API call ──

  def openrouter_client
    @openrouter_client ||= OpenAI::Client.new(
      access_token: ENV.fetch("OPENROUTER_API_KEY"),
      uri_base: "https://openrouter.ai/api/v1",
      log_errors: true,
      extra_headers: {
        "HTTP-Referer" => ENV.fetch("FRONTEND_URL", "http://localhost:3000"),
        "X-Title" => "CamChecklist"
      }
    )
  end

  def call_claude(messages:, tools:, system_override: nil)
    start_time = Time.current
    response = openrouter_client.chat(
      parameters: {
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system_override || system_prompt },
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

  # ── Response handlers ──

  def handle_voice_response(response)
    message = response.dig("choices", 0, "message")
    tool_calls = message&.dig("tool_calls") || []

    checked_items = []
    deleted_items = []
    reasoning = ""

    tool_calls.each do |tc|
      name = tc.dig("function", "name")
      input = JSON.parse(tc.dig("function", "arguments"))

      case name
      when "check_items"
        reasoning = input["reasoning"] || ""
        (input["item_ids"] || []).each do |id|
          item = @items.find { |i| i.id == id }
          next unless item && !item.completed?
          item.update!(completed: true, completed_via: "voice", completed_at: Time.current)
          checked_items << item
        end
      when "delete_items"
        reasoning = input["reasoning"] || "" if reasoning.empty?
        (input["item_ids"] || []).each do |id|
          item = @items.find { |i| i.id == id }
          next unless item
          deleted_items << item.as_json
          item.destroy!
        end
      end
    end

    {
      checked_items: checked_items.map(&:as_json),
      deleted_items: deleted_items,
      reasoning: reasoning.presence || "No items matched"
    }
  end

  def handle_tool_response(response, completed_via)
    message = response.dig("choices", 0, "message")
    tool_calls = message&.dig("tool_calls") || []
    tool_call = tool_calls.find { |tc| tc.dig("function", "name") == "check_items" }

    return { checked_items: [], reasoning: "No items matched" } unless tool_call

    input = JSON.parse(tool_call.dig("function", "arguments"))
    item_ids = input["item_ids"] || []
    reasoning = input["reasoning"] || ""

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

  def handle_assistant_response(response)
    message = response.dig("choices", 0, "message")
    tool_calls = message&.dig("tool_calls") || []

    answer = nil
    related_items = []
    actions = []
    context_switch = nil

    tool_calls.each do |tc|
      name = tc.dig("function", "name")
      input = JSON.parse(tc.dig("function", "arguments"))

      case name
      when "answer_question"
        answer = input["answer"]
        related_ids = input["related_item_ids"] || []
        related_items = @items.select { |i| related_ids.include?(i.id) }

      when "add_item"
        item = @checklist.items.create!(
          text: input["text"],
          priority: input["priority"] || "normal",
          position: (@items.maximum(:position) || 0) + 1
        )
        actions << { type: "added", item: item.as_json }

      when "edit_item"
        item = find_user_item(input["item_id"])
        if item
          updates = {}
          updates[:text] = input["text"] if input["text"]
          updates[:priority] = input["priority"] if input["priority"]
          item.update!(updates) if updates.any?
          actions << { type: "edited", item: item.reload.as_json }
        end

      when "delete_item"
        item = find_user_item(input["item_id"])
        if item
          actions << { type: "deleted", item: item.as_json }
          item.destroy!
        end

      when "toggle_item"
        item = find_user_item(input["item_id"])
        if item
          completed = input["completed"]
          item.update!(
            completed: completed,
            completed_via: completed ? "assistant" : nil,
            completed_at: completed ? Time.current : nil
          )
          actions << { type: completed ? "completed" : "unchecked", item: item.reload.as_json }
        end

      when "switch_context"
        context_switch = {
          project_id: input["project_id"],
          checklist_id: input["checklist_id"],
          reason: input["reason"]
        }
      end
    end

    # Fall back to text content if no answer_question tool was used
    if answer.nil?
      answer = message&.dig("content") || "Done."
    end

    result = { answer: answer, related_items: related_items.map(&:as_json) }
    result[:actions] = actions if actions.any?
    result[:context_switch] = context_switch if context_switch
    result
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
      text = message&.dig("content") || "I couldn't process that question."
      { answer: text, related_items: [] }
    end
  end

  # ── Langfuse ──

  # Find an item across all the user's checklists (not just the current one)
  def find_user_item(item_id)
    return nil unless item_id
    # First check current checklist's items (fast path)
    item = @items.find { |i| i.id == item_id }
    return item if item

    # Search across all user's items
    user = @checklist.project.user
    return nil unless user
    Item.joins(checklist: :project).where(projects: { user_id: user.id }).find_by(id: item_id)
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
