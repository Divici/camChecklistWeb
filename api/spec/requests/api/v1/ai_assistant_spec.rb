require 'rails_helper'

RSpec.describe "Api::V1::Ai#assistant", type: :request do
  include_context "authenticated"

  let(:project) { create(:project, user: current_user) }
  let(:checklist) { create(:checklist, project: project) }
  let!(:item1) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
  let!(:item2) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }

  let(:mock_client) { instance_double(OpenAI::Client) }

  before do
    allow(OpenAI::Client).to receive(:new).and_return(mock_client)
  end

  def post_assistant(question, headers: auth_headers)
    post "/api/v1/checklists/#{checklist.id}/assistant",
         params: { question: question },
         headers: headers
  end

  describe "POST /api/v1/checklists/:checklist_id/assistant" do
    it "returns answer when assistant uses answer_question tool" do
      tool_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "You have 2 items remaining.", "related_item_ids" => [item1.id, item2.id] }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [tool_call]))

      post_assistant("How many items left?")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["answer"]).to eq("You have 2 items remaining.")
      expect(json["related_items"].length).to eq(2)
    end

    it "adds item when assistant uses add_item tool" do
      add_call = build_tool_call(
        name: "add_item",
        arguments: { "text" => "Clean Kitchen", "priority" => "high" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Added Clean Kitchen to your list." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [add_call, answer_call]))

      expect {
        post_assistant("Add Clean Kitchen with high priority")
      }.to change(Item, :count).by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["answer"]).to eq("Added Clean Kitchen to your list.")
      expect(json["actions"].length).to eq(1)
      expect(json["actions"].first["type"]).to eq("added")
      expect(json["actions"].first["item"]["text"]).to eq("Clean Kitchen")

      new_item = Item.find_by(text: "Clean Kitchen")
      expect(new_item.priority).to eq("high")
      expect(new_item.checklist_id).to eq(checklist.id)
    end

    it "edits item when assistant uses edit_item tool" do
      edit_call = build_tool_call(
        name: "edit_item",
        arguments: { "item_id" => item1.id, "text" => "Wash Car Thoroughly", "priority" => "high" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Updated the item." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [edit_call, answer_call]))

      post_assistant("Rename Wash Car to Wash Car Thoroughly and make it high priority")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["actions"].first["type"]).to eq("edited")

      item1.reload
      expect(item1.text).to eq("Wash Car Thoroughly")
      expect(item1.priority).to eq("high")
    end

    it "deletes item when assistant uses delete_item tool" do
      delete_call = build_tool_call(
        name: "delete_item",
        arguments: { "item_id" => item1.id }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Deleted Wash Car." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [delete_call, answer_call]))

      expect {
        post_assistant("Delete Wash Car")
      }.to change(Item, :count).by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["actions"].first["type"]).to eq("deleted")
      expect(Item.find_by(id: item1.id)).to be_nil
    end

    it "toggles item complete when assistant uses toggle_item tool with completed=true" do
      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => true }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Marked Wash Car as complete." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [toggle_call, answer_call]))

      post_assistant("Mark Wash Car as done")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["actions"].first["type"]).to eq("completed")

      item1.reload
      expect(item1.completed).to be true
      expect(item1.completed_via).to eq("assistant")
      expect(item1.completed_at).to be_present
    end

    it "toggles item incomplete when assistant uses toggle_item tool with completed=false" do
      item1.update!(completed: true, completed_via: "assistant", completed_at: Time.current)

      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => false }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Unchecked Wash Car." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [toggle_call, answer_call]))

      post_assistant("Uncheck Wash Car")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["actions"].first["type"]).to eq("unchecked")

      item1.reload
      expect(item1.completed).to be false
      expect(item1.completed_via).to be_nil
      expect(item1.completed_at).to be_nil
    end

    it "returns context_switch when assistant uses switch_context tool" do
      other_project = create(:project, user: current_user, name: "Work")
      other_checklist = create(:checklist, project: other_project, name: "Meetings")

      switch_call = build_tool_call(
        name: "switch_context",
        arguments: { "project_id" => other_project.id, "checklist_id" => other_checklist.id, "reason" => "That item belongs to your Work project." }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "That sounds like it belongs in your Work project." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [switch_call, answer_call]))

      post_assistant("Add meeting with client")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["context_switch"]["project_id"]).to eq(other_project.id)
      expect(json["context_switch"]["checklist_id"]).to eq(other_checklist.id)
      expect(json["context_switch"]["reason"]).to eq("That item belongs to your Work project.")
    end

    it "returns combined answer and actions when multiple tools used" do
      add_call = build_tool_call(
        name: "add_item",
        arguments: { "text" => "Mop Floors" }
      )
      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => true }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Done! Added Mop Floors and completed Wash Car." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [add_call, toggle_call, answer_call]))

      post_assistant("Add Mop Floors and mark Wash Car as done")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["answer"]).to eq("Done! Added Mop Floors and completed Wash Car.")
      expect(json["actions"].length).to eq(2)
      types = json["actions"].map { |a| a["type"] }
      expect(types).to contain_exactly("added", "completed")
    end

    it "returns 422 when question param missing" do
      post "/api/v1/checklists/#{checklist.id}/assistant",
           params: {},
           headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to be_present
    end

    it "returns 401 without auth headers" do
      post "/api/v1/checklists/#{checklist.id}/assistant",
           params: { question: "test" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 404 when checklist doesn't belong to user" do
      other_user = create(:user)
      other_project = create(:project, user: other_user)
      other_checklist = create(:checklist, project: other_project)

      post "/api/v1/checklists/#{other_checklist.id}/assistant",
           params: { question: "test" },
           headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end

    it "handles API errors gracefully" do
      allow(mock_client).to receive(:chat).and_raise(
        Faraday::ServerError.new(
          status: 500,
          body: '{"error":{"message":"Internal server error"}}',
          response: { status: 500, body: '{"error":{"message":"Internal server error"}}' }
        )
      )

      post_assistant("test question")

      expect(response).to have_http_status(:bad_gateway)
      json = JSON.parse(response.body)
      expect(json["error"]).to include("AI service error")
    end
  end
end
