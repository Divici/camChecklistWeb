require 'rails_helper'

RSpec.describe "Api::V1::Ai", type: :request do
  let(:checklist) { create(:checklist) }
  let!(:item1) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
  let!(:item2) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }

  let(:mock_client) { instance_double(Anthropic::Client) }
  let(:mock_messages) { instance_double(Anthropic::Resources::Messages) }

  before do
    allow(Anthropic::Client).to receive(:new).and_return(mock_client)
    allow(mock_client).to receive(:messages).and_return(mock_messages)
  end

  def build_tool_use_block(name:, input:)
    block = double("ToolUseBlock")
    allow(block).to receive(:type).and_return(:tool_use)
    allow(block).to receive(:name).and_return(name)
    allow(block).to receive(:input).and_return(input)
    block
  end

  def build_text_block(text:)
    block = double("TextBlock")
    allow(block).to receive(:type).and_return(:text)
    allow(block).to receive(:text).and_return(text)
    block
  end

  def build_response(content_blocks:)
    usage = double("Usage", input_tokens: 100, output_tokens: 50)
    double("Response", content: content_blocks, usage: usage)
  end

  describe "POST /api/v1/checklists/:checklist_id/voice" do
    it "processes a voice transcript and returns checked items" do
      tool_block = build_tool_use_block(
        name: "check_items",
        input: { "item_ids" => [item1.id], "reasoning" => "User washed their car" }
      )
      allow(mock_messages).to receive(:create).and_return(build_response(content_blocks: [tool_block]))

      post "/api/v1/checklists/#{checklist.id}/voice", params: { transcript: "I just washed the car" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["checked_items"].length).to eq(1)
      expect(json["reasoning"]).to eq("User washed their car")
    end

    it "returns unprocessable_entity when transcript is missing" do
      post "/api/v1/checklists/#{checklist.id}/voice", params: {}

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 404 for an invalid checklist id" do
      post "/api/v1/checklists/999999/voice", params: { transcript: "test" }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/checklists/:checklist_id/photo" do
    it "processes a photo and returns checked items" do
      tool_block = build_tool_use_block(
        name: "check_items",
        input: { "item_ids" => [item1.id], "reasoning" => "Photo shows a clean car" }
      )
      allow(mock_messages).to receive(:create).and_return(build_response(content_blocks: [tool_block]))

      image = Rack::Test::UploadedFile.new(
        StringIO.new("fake image data"),
        "image/jpeg",
        original_filename: "photo.jpg"
      )

      post "/api/v1/checklists/#{checklist.id}/photo", params: { image: image }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["checked_items"].length).to eq(1)
      expect(json["reasoning"]).to eq("Photo shows a clean car")
    end

    it "returns unprocessable_entity when image is missing" do
      post "/api/v1/checklists/#{checklist.id}/photo", params: {}

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Image required")
    end
  end

  describe "POST /api/v1/checklists/:checklist_id/ask" do
    it "answers a question about the checklist" do
      tool_block = build_tool_use_block(
        name: "answer_question",
        input: { "answer" => "You have 2 items remaining.", "related_item_ids" => [item1.id, item2.id] }
      )
      allow(mock_messages).to receive(:create).and_return(build_response(content_blocks: [tool_block]))

      post "/api/v1/checklists/#{checklist.id}/ask", params: { question: "How many items left?" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["answer"]).to eq("You have 2 items remaining.")
      expect(json["related_items"].length).to eq(2)
    end

    it "returns unprocessable_entity when question is missing" do
      post "/api/v1/checklists/#{checklist.id}/ask", params: {}

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 404 for an invalid checklist id" do
      post "/api/v1/checklists/999999/ask", params: { question: "test" }

      expect(response).to have_http_status(:not_found)
    end
  end
end
