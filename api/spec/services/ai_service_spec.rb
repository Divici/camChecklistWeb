require 'rails_helper'

RSpec.describe AiService, type: :service do
  let(:checklist) { create(:checklist) }
  let!(:item1) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
  let!(:item2) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }
  let!(:item3) { create(:item, checklist: checklist, text: "Walk Dog", position: 3, completed: true, completed_via: "manual") }

  let(:service) { described_class.new(checklist) }
  let(:mock_client) { instance_double(OpenAI::Client) }

  before do
    allow(OpenAI::Client).to receive(:new).and_return(mock_client)
  end

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

  describe "#process_voice" do
    it "marks matched items as complete via voice" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item1.id], "reasoning" => "User mentioned washing their car" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_voice("I just washed the car")

      expect(result[:checked_items].length).to eq(1)
      expect(result[:checked_items].first["id"]).to eq(item1.id)
      expect(result[:reasoning]).to eq("User mentioned washing their car")

      item1.reload
      expect(item1.completed).to be true
      expect(item1.completed_via).to eq("voice")
      expect(item1.completed_at).to be_present
    end

    it "marks multiple items as complete" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item1.id, item2.id], "reasoning" => "User did both tasks" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_voice("I washed the car and bought groceries")

      expect(result[:checked_items].length).to eq(2)
      expect(item1.reload.completed).to be true
      expect(item2.reload.completed).to be true
    end

    it "skips already completed items" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item3.id], "reasoning" => "User mentioned walking the dog" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_voice("I walked the dog")

      expect(result[:checked_items]).to be_empty
    end

    it "returns empty when Claude finds no matches" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [], "reasoning" => "Nothing matched" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_voice("I played video games")

      expect(result[:checked_items]).to be_empty
      expect(result[:reasoning]).to eq("Nothing matched")
    end

    it "returns no-match when Claude does not use the tool" do
      response = build_response(content: "I'm not sure what you mean.")
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_voice("")

      expect(result[:checked_items]).to eq([])
      expect(result[:reasoning]).to eq("No items matched")
    end
  end

  describe "#process_photo" do
    it "marks items as complete via photo" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item1.id], "reasoning" => "Photo shows a clean car" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_photo("base64encodedimage", "image/jpeg")

      expect(result[:checked_items].length).to eq(1)
      expect(result[:reasoning]).to eq("Photo shows a clean car")

      item1.reload
      expect(item1.completed).to be true
      expect(item1.completed_via).to eq("photo")
    end

    it "returns no-match when Claude finds nothing in the photo" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [], "reasoning" => "Cannot identify any completed tasks" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.process_photo("base64encodedimage", "image/png")

      expect(result[:checked_items]).to be_empty
    end
  end

  describe "#answer_question" do
    it "returns an answer with related items via tool use" do
      tool_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "You have 2 items remaining.", "related_item_ids" => [item1.id, item2.id] }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.answer_question("How many items are left?")

      expect(result[:answer]).to eq("You have 2 items remaining.")
      expect(result[:related_items].length).to eq(2)
    end

    it "returns an answer without related items" do
      tool_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Your checklist is about errands." }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.answer_question("What is this checklist about?")

      expect(result[:answer]).to eq("Your checklist is about errands.")
      expect(result[:related_items]).to be_empty
    end

    it "falls back to text response when no tool is used" do
      response = build_response(content: "Here is your checklist status.")
      allow(mock_client).to receive(:chat).and_return(response)

      result = service.answer_question("What's happening?")

      expect(result[:answer]).to eq("Here is your checklist status.")
      expect(result[:related_items]).to be_empty
    end
  end

  describe "Langfuse integration" do
    it "logs to Langfuse when configured" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [], "reasoning" => "No match" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("LANGFUSE_PUBLIC_KEY").and_return("pk-test")
      allow(ENV).to receive(:[]).with("LANGFUSE_SECRET_KEY").and_return("sk-test")
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("OPENROUTER_API_KEY").and_return("sk-or-test")
      allow(ENV).to receive(:fetch).with("LANGFUSE_HOST", "https://cloud.langfuse.com").and_return("https://cloud.langfuse.com")

      mock_trace = double("LangfuseTrace", id: "trace-123")
      allow(Langfuse).to receive(:configure).and_yield(double("config").as_null_object)
      allow(Langfuse).to receive(:trace).and_return(mock_trace)
      allow(Langfuse).to receive(:generation).and_return(double("generation"))
      allow(Langfuse).to receive(:flush)

      service.process_voice("test transcript")

      expect(Langfuse).to have_received(:trace)
      expect(Langfuse).to have_received(:generation)
      expect(Langfuse).to have_received(:flush)
    end

    it "does not log to Langfuse when not configured" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [], "reasoning" => "No match" }
      )
      response = build_response(tool_calls: [tool_call])
      allow(mock_client).to receive(:chat).and_return(response)

      allow(Langfuse).to receive(:trace)

      service.process_voice("test transcript")

      expect(Langfuse).not_to have_received(:trace)
    end
  end
end
