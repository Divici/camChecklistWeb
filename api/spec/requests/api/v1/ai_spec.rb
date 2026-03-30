require 'rails_helper'

RSpec.describe "Api::V1::Ai", type: :request do
  include_context "authenticated"

  let(:project) { create(:project, user: current_user) }
  let(:checklist) { create(:checklist, project: project) }
  let!(:item1) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
  let!(:item2) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }

  let(:mock_client) { instance_double(OpenAI::Client) }

  before do
    allow(OpenAI::Client).to receive(:new).and_return(mock_client)
  end

  describe "POST /api/v1/checklists/:checklist_id/voice" do
    it "processes a voice transcript and returns checked items" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item1.id], "reasoning" => "User washed their car" }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [tool_call]))

      post "/api/v1/checklists/#{checklist.id}/voice",
           params: { transcript: "I just washed the car" },
           headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["checked_items"].length).to eq(1)
      expect(json["reasoning"]).to eq("User washed their car")
    end

    it "returns unprocessable_entity when transcript is missing" do
      post "/api/v1/checklists/#{checklist.id}/voice", params: {}, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 404 for an invalid checklist id" do
      post "/api/v1/checklists/999999/voice",
           params: { transcript: "test" },
           headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end

    it "returns 401 without auth headers" do
      post "/api/v1/checklists/#{checklist.id}/voice", params: { transcript: "test" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/checklists/:checklist_id/photo" do
    it "processes a photo and returns checked items" do
      tool_call = build_tool_call(
        name: "check_items",
        arguments: { "item_ids" => [item1.id], "reasoning" => "Photo shows a clean car" }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [tool_call]))

      image = Rack::Test::UploadedFile.new(
        StringIO.new("fake image data"),
        "image/jpeg",
        original_filename: "photo.jpg"
      )

      post "/api/v1/checklists/#{checklist.id}/photo",
           params: { image: image },
           headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["checked_items"].length).to eq(1)
      expect(json["reasoning"]).to eq("Photo shows a clean car")
    end

    it "returns unprocessable_entity when image is missing" do
      post "/api/v1/checklists/#{checklist.id}/photo", params: {}, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Image required")
    end
  end

  describe "POST /api/v1/checklists/:checklist_id/ask" do
    it "answers a question about the checklist" do
      tool_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "You have 2 items remaining.", "related_item_ids" => [item1.id, item2.id] }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [tool_call]))

      post "/api/v1/checklists/#{checklist.id}/ask",
           params: { question: "How many items left?" },
           headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["answer"]).to eq("You have 2 items remaining.")
      expect(json["related_items"].length).to eq(2)
    end

    it "returns unprocessable_entity when question is missing" do
      post "/api/v1/checklists/#{checklist.id}/ask", params: {}, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 404 for an invalid checklist id" do
      post "/api/v1/checklists/999999/ask",
           params: { question: "test" },
           headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
