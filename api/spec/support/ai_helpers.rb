module AiHelpers
  def build_tool_call(name:, arguments:)
    {
      "id" => "call_#{SecureRandom.hex(4)}",
      "type" => "function",
      "function" => {
        "name" => name,
        "arguments" => arguments.to_json
      }
    }
  end

  def build_response(tool_calls: nil, content: nil)
    message = { "role" => "assistant" }
    message["tool_calls"] = tool_calls if tool_calls
    message["content"] = content if content
    {
      "choices" => [{ "message" => message }],
      "usage" => { "prompt_tokens" => 100, "completion_tokens" => 50 }
    }
  end
end

RSpec.configure do |config|
  config.include AiHelpers, type: :request
  config.include AiHelpers, type: :service
end
