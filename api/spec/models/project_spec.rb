require 'rails_helper'

RSpec.describe Project, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      project = build(:project)
      expect(project).to be_valid
    end

    it 'is invalid without a name' do
      project = build(:project, name: nil)
      expect(project).not_to be_valid
      expect(project.errors[:name]).to include("can't be blank")
    end
  end

  describe 'associations' do
    it 'has many checklists' do
      association = described_class.reflect_on_association(:checklists)
      expect(association.macro).to eq(:has_many)
    end

    it 'destroys dependent checklists' do
      project = create(:project)
      create(:checklist, project: project)
      expect { project.destroy }.to change(Checklist, :count).by(-1)
    end
  end

  describe '#as_json' do
    it 'includes computed fields' do
      project = create(:project)
      checklist = create(:checklist, project: project)
      create(:item, checklist: checklist, completed: true)
      create(:item, checklist: checklist, completed: false)

      json = project.as_json
      expect(json).to include(
        "checklists_count" => 1,
        "items_count" => 2,
        "completed_items_count" => 1,
        "progress_percentage" => 50.0
      )
    end

    it 'returns 0 progress when no items' do
      project = create(:project)
      json = project.as_json
      expect(json["progress_percentage"]).to eq(0)
    end
  end
end
