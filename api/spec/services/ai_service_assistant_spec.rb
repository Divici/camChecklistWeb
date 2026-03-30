require 'rails_helper'

RSpec.describe AiService, "#assistant_ask", type: :service do
  let(:user) { create(:user) }
  let(:project) { create(:project, user: user) }
  let(:checklist) { create(:checklist, project: project, name: "Errands") }
  let!(:item1) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
  let!(:item2) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }
  let!(:item3) { create(:item, checklist: checklist, text: "Walk Dog", position: 3, completed: true, completed_via: "manual") }

  let(:service) { described_class.new(checklist) }
  let(:mock_client) { instance_double(OpenAI::Client) }

  before do
    allow(OpenAI::Client).to receive(:new).and_return(mock_client)
  end

  describe "answer_question tool" do
    it "returns answer and related items" do
      tool_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "You have 2 incomplete items.", "related_item_ids" => [item1.id, item2.id] }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [tool_call]))

      result = service.assistant_ask("How many items left?")

      expect(result[:answer]).to eq("You have 2 incomplete items.")
      expect(result[:related_items].length).to eq(2)
      expect(result[:related_items].map { |i| i["id"] }).to contain_exactly(item1.id, item2.id)
    end
  end

  describe "add_item tool" do
    it "creates item in database with correct attributes" do
      add_call = build_tool_call(
        name: "add_item",
        arguments: { "text" => "Clean Kitchen", "priority" => "high" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Added Clean Kitchen." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [add_call, answer_call]))

      expect {
        result = service.assistant_ask("Add Clean Kitchen with high priority")
        expect(result[:actions].length).to eq(1)
        expect(result[:actions].first[:type]).to eq("added")
        expect(result[:actions].first[:item]["text"]).to eq("Clean Kitchen")
      }.to change(Item, :count).by(1)

      new_item = Item.find_by(text: "Clean Kitchen")
      expect(new_item.priority).to eq("high")
      expect(new_item.checklist_id).to eq(checklist.id)
      expect(new_item.position).to eq(4) # after existing 3 items
    end

    it "defaults priority to normal when not specified" do
      add_call = build_tool_call(
        name: "add_item",
        arguments: { "text" => "New Task" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Added." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [add_call, answer_call]))

      service.assistant_ask("Add New Task")

      new_item = Item.find_by(text: "New Task")
      expect(new_item.priority).to eq("normal")
    end
  end

  describe "edit_item tool" do
    it "updates item text and priority" do
      edit_call = build_tool_call(
        name: "edit_item",
        arguments: { "item_id" => item1.id, "text" => "Wash Car Thoroughly", "priority" => "high" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Updated." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [edit_call, answer_call]))

      result = service.assistant_ask("Rename Wash Car")

      expect(result[:actions].first[:type]).to eq("edited")

      item1.reload
      expect(item1.text).to eq("Wash Car Thoroughly")
      expect(item1.priority).to eq("high")
    end
  end

  describe "delete_item tool" do
    it "destroys item from database" do
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
        result = service.assistant_ask("Delete Wash Car")
        expect(result[:actions].first[:type]).to eq("deleted")
        expect(result[:actions].first[:item]["id"]).to eq(item1.id)
      }.to change(Item, :count).by(-1)

      expect(Item.find_by(id: item1.id)).to be_nil
    end
  end

  describe "toggle_item tool" do
    it "marks item complete with completed_via=assistant" do
      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => true }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Done." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [toggle_call, answer_call]))

      result = service.assistant_ask("Mark Wash Car as done")

      expect(result[:actions].first[:type]).to eq("completed")

      item1.reload
      expect(item1.completed).to be true
      expect(item1.completed_via).to eq("assistant")
      expect(item1.completed_at).to be_present
    end

    it "marks item incomplete and clears completed_via and completed_at" do
      item1.update!(completed: true, completed_via: "assistant", completed_at: Time.current)

      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => false }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Unchecked." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [toggle_call, answer_call]))

      result = service.assistant_ask("Uncheck Wash Car")

      expect(result[:actions].first[:type]).to eq("unchecked")

      item1.reload
      expect(item1.completed).to be false
      expect(item1.completed_via).to be_nil
      expect(item1.completed_at).to be_nil
    end
  end

  describe "switch_context tool" do
    it "returns context_switch data" do
      other_project = create(:project, user: user, name: "Work")
      other_checklist = create(:checklist, project: other_project, name: "Tasks")

      switch_call = build_tool_call(
        name: "switch_context",
        arguments: { "project_id" => other_project.id, "checklist_id" => other_checklist.id, "reason" => "Belongs to Work project." }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "That belongs in your Work project." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [switch_call, answer_call]))

      result = service.assistant_ask("Add meeting with client")

      expect(result[:context_switch][:project_id]).to eq(other_project.id)
      expect(result[:context_switch][:checklist_id]).to eq(other_checklist.id)
      expect(result[:context_switch][:reason]).to eq("Belongs to Work project.")
    end
  end

  describe "fallback behavior" do
    it "falls back to message content when no answer_question tool used" do
      allow(mock_client).to receive(:chat).and_return(build_response(content: "Here is a plain text response."))

      result = service.assistant_ask("Hello")

      expect(result[:answer]).to eq("Here is a plain text response.")
      expect(result[:related_items]).to be_empty
    end
  end

  describe "#find_user_item" do
    it "searches current checklist first" do
      edit_call = build_tool_call(
        name: "edit_item",
        arguments: { "item_id" => item1.id, "text" => "Updated" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Done." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [edit_call, answer_call]))

      result = service.assistant_ask("Edit Wash Car")

      expect(result[:actions].first[:type]).to eq("edited")
      expect(result[:actions].first[:item]["text"]).to eq("Updated")
    end

    it "falls back to searching all user items across checklists" do
      other_checklist = create(:checklist, project: project, name: "Other List")
      other_item = create(:item, checklist: other_checklist, text: "Remote Item", position: 1)

      edit_call = build_tool_call(
        name: "edit_item",
        arguments: { "item_id" => other_item.id, "text" => "Remote Item Updated" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Done." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [edit_call, answer_call]))

      result = service.assistant_ask("Edit Remote Item")

      expect(result[:actions].first[:type]).to eq("edited")
      other_item.reload
      expect(other_item.text).to eq("Remote Item Updated")
    end

    it "returns nil for items belonging to other users" do
      other_user = create(:user)
      other_project = create(:project, user: other_user)
      other_checklist = create(:checklist, project: other_project)
      other_item = create(:item, checklist: other_checklist, text: "Secret Item", position: 1)

      edit_call = build_tool_call(
        name: "edit_item",
        arguments: { "item_id" => other_item.id, "text" => "Hacked" }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "Done." }
      )
      allow(mock_client).to receive(:chat).and_return(build_response(tool_calls: [edit_call, answer_call]))

      result = service.assistant_ask("Edit Secret Item")

      # No action should be taken since item belongs to another user
      expect(result[:actions]).to be_nil
      other_item.reload
      expect(other_item.text).to eq("Secret Item")
    end
  end

  describe "multiple tool calls" do
    it "handles multiple tool calls in a single response" do
      add_call = build_tool_call(
        name: "add_item",
        arguments: { "text" => "New Task" }
      )
      toggle_call = build_tool_call(
        name: "toggle_item",
        arguments: { "item_id" => item1.id, "completed" => true }
      )
      delete_call = build_tool_call(
        name: "delete_item",
        arguments: { "item_id" => item2.id }
      )
      answer_call = build_tool_call(
        name: "answer_question",
        arguments: { "answer" => "All done!" }
      )
      allow(mock_client).to receive(:chat).and_return(
        build_response(tool_calls: [add_call, toggle_call, delete_call, answer_call])
      )

      result = service.assistant_ask("Add New Task, complete Wash Car, delete Buy Groceries")

      expect(result[:answer]).to eq("All done!")
      expect(result[:actions].length).to eq(3)
      types = result[:actions].map { |a| a[:type] }
      expect(types).to contain_exactly("added", "completed", "deleted")

      # Verify DB state
      expect(Item.find_by(text: "New Task")).to be_present
      expect(item1.reload.completed).to be true
      expect(Item.find_by(id: item2.id)).to be_nil
    end
  end
end
