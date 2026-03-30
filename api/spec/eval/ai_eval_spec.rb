require "rails_helper"

RSpec.describe "AI Eval", :eval do
  # Uses real OpenRouter API - requires OPENROUTER_API_KEY env var
  # Run with: bundle exec rspec --tag eval
  #
  # These tests are NON-DETERMINISTIC. AI responses may vary between runs.
  # They verify behavioral outcomes (items created/deleted/checked) rather than exact text.

  before do
    skip "OPENROUTER_API_KEY not set" unless ENV["OPENROUTER_API_KEY"].present?
  end

  # ── Voice Processing Evals ──

  describe "voice processing" do
    let(:user) { create(:user) }
    let(:project) { create(:project, user: user, name: "Daily Tasks") }
    let(:checklist) { create(:checklist, project: project, name: "Today's Tasks") }

    let!(:wash_car_item) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
    let!(:buy_groceries_item) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }
    let!(:walk_dog_item) { create(:item, checklist: checklist, text: "Walk the Dog", position: 3) }
    let!(:clean_kitchen_item) { create(:item, checklist: checklist, text: "Clean Kitchen", position: 4) }
    let!(:do_laundry_item) { create(:item, checklist: checklist, text: "Do Laundry", position: 5) }

    it "marks 'Wash Car' as completed from colloquial speech about washing the car" do
      service = AiService.new(checklist)
      result = service.process_voice("just finished washing the car")

      wash_car_item.reload
      expect(wash_car_item.completed).to be(true), "Expected 'Wash Car' to be marked completed"
      expect(wash_car_item.completed_via).to eq("voice")

      # Other items should remain unchecked
      expect(buy_groceries_item.reload.completed).to be(false), "Expected 'Buy Groceries' to remain unchecked"
      expect(walk_dog_item.reload.completed).to be(false), "Expected 'Walk the Dog' to remain unchecked"
    end

    it "marks 'Buy Groceries' as completed from indirect speech about shopping" do
      service = AiService.new(checklist)
      result = service.process_voice("I went to the store and got everything")

      buy_groceries_item.reload
      expect(buy_groceries_item.completed).to be(true), "Expected 'Buy Groceries' to be marked completed"
      expect(buy_groceries_item.completed_via).to eq("voice")
    end

    it "marks 'Walk the Dog' as completed from natural speech about walking the dog" do
      service = AiService.new(checklist)
      result = service.process_voice("took the dog for a walk around the block")

      walk_dog_item.reload
      expect(walk_dog_item.completed).to be(true), "Expected 'Walk the Dog' to be marked completed"
      expect(walk_dog_item.completed_via).to eq("voice")
    end

    it "does NOT mark any items when speech is unrelated to checklist items" do
      service = AiService.new(checklist)
      result = service.process_voice("played video games all day")

      expect(wash_car_item.reload.completed).to be(false), "Expected 'Wash Car' to remain unchecked"
      expect(buy_groceries_item.reload.completed).to be(false), "Expected 'Buy Groceries' to remain unchecked"
      expect(walk_dog_item.reload.completed).to be(false), "Expected 'Walk the Dog' to remain unchecked"
      expect(clean_kitchen_item.reload.completed).to be(false), "Expected 'Clean Kitchen' to remain unchecked"
      expect(do_laundry_item.reload.completed).to be(false), "Expected 'Do Laundry' to remain unchecked"
    end

    it "marks multiple items when speech mentions more than one task" do
      service = AiService.new(checklist)
      result = service.process_voice("washed the car and walked the dog")

      wash_car_item.reload
      walk_dog_item.reload

      expect(wash_car_item.completed).to be(true), "Expected 'Wash Car' to be marked completed"
      expect(walk_dog_item.completed).to be(true), "Expected 'Walk the Dog' to be marked completed"

      # Unrelated items should remain unchecked
      expect(buy_groceries_item.reload.completed).to be(false), "Expected 'Buy Groceries' to remain unchecked"
      expect(clean_kitchen_item.reload.completed).to be(false), "Expected 'Clean Kitchen' to remain unchecked"
      expect(do_laundry_item.reload.completed).to be(false), "Expected 'Do Laundry' to remain unchecked"
    end
  end

  # ── Assistant Tool Selection Evals ──

  describe "assistant tool selection" do
    let(:user) { create(:user) }
    let(:project) { create(:project, user: user, name: "Errands") }
    let(:checklist) { create(:checklist, project: project, name: "Shopping List") }

    let!(:wash_car_item) { create(:item, checklist: checklist, text: "Wash Car", position: 1) }
    let!(:buy_groceries_item) { create(:item, checklist: checklist, text: "Buy Groceries", position: 2) }
    let!(:walk_dog_item) { create(:item, checklist: checklist, text: "Walk the Dog", position: 3) }

    it "uses add_item tool when asked to add something" do
      service = AiService.new(checklist)
      initial_count = checklist.items.count

      result = service.assistant_ask("add milk to the list")

      checklist.reload
      expect(checklist.items.count).to eq(initial_count + 1),
        "Expected item count to increase by 1 (was #{initial_count}, now #{checklist.items.count})"

      new_item = checklist.items.order(:created_at).last
      expect(new_item.text.downcase).to include("milk"),
        "Expected new item text to include 'milk', got: '#{new_item.text}'"
    end

    it "answers a question without modifying items" do
      service = AiService.new(checklist)
      items_before = checklist.items.pluck(:id, :completed, :text)

      result = service.assistant_ask("what's left to do?")

      # Should return an answer
      expect(result[:answer]).to be_present, "Expected an answer string in the response"

      # Should NOT have modified any items
      items_after = checklist.items.reload.pluck(:id, :completed, :text)
      expect(items_after).to eq(items_before),
        "Expected items to remain unchanged after asking a question"
    end

    it "uses toggle_item tool to mark an item as done" do
      service = AiService.new(checklist)

      result = service.assistant_ask("mark 'Walk the Dog' as done")

      walk_dog_item.reload
      expect(walk_dog_item.completed).to be(true),
        "Expected 'Walk the Dog' to be marked completed via toggle_item"
    end

    it "uses delete_item tool to remove an item" do
      service = AiService.new(checklist)
      item_id = buy_groceries_item.id

      result = service.assistant_ask("delete 'Buy Groceries'")

      expect(Item.find_by(id: item_id)).to be_nil,
        "Expected 'Buy Groceries' item (ID: #{item_id}) to be destroyed"
    end

    it "uses edit_item tool to change item text" do
      service = AiService.new(checklist)

      result = service.assistant_ask("change 'Wash Car' to 'Wash and Wax Car'")

      wash_car_item.reload
      expect(wash_car_item.text.downcase).to include("wash").and include("wax"),
        "Expected item text to contain 'wash' and 'wax', got: '#{wash_car_item.text}'"
    end
  end

  # ── Cross-Project Context Evals ──

  describe "cross-project context switching" do
    let(:user) { create(:user) }

    let(:home_project) { create(:project, user: user, name: "Home") }
    let(:home_checklist) { create(:checklist, project: home_project, name: "Kitchen Cleaning") }
    let!(:home_item) { create(:item, checklist: home_checklist, text: "Scrub countertops", position: 1) }

    let(:work_project) { create(:project, user: user, name: "Work") }
    let(:work_checklist) { create(:checklist, project: work_project, name: "Sprint Tasks") }
    let!(:work_item) { create(:item, checklist: work_checklist, text: "Fix login bug", position: 1) }

    it "suggests switching context when user asks about a checklist in a different project" do
      # Start from the Work project's checklist, ask about Home
      service = AiService.new(work_checklist)

      result = service.assistant_ask("what about my Kitchen Cleaning checklist in the Home project?")

      expect(result[:context_switch]).to be_present,
        "Expected a context_switch suggestion when asking about a different project's checklist"
      expect(result[:context_switch][:project_id]).to eq(home_project.id),
        "Expected context_switch to point to the Home project (ID: #{home_project.id})"
      expect(result[:context_switch][:checklist_id]).to eq(home_checklist.id),
        "Expected context_switch to point to the Kitchen Cleaning checklist (ID: #{home_checklist.id})"
    end
  end
end
