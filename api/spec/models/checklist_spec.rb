require 'rails_helper'

RSpec.describe Checklist, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      checklist = build(:checklist)
      expect(checklist).to be_valid
    end

    it 'is invalid without a name' do
      checklist = build(:checklist, name: nil)
      expect(checklist).not_to be_valid
      expect(checklist.errors[:name]).to include("can't be blank")
    end
  end

  describe 'associations' do
    it 'belongs to a project' do
      association = described_class.reflect_on_association(:project)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'has many items' do
      association = described_class.reflect_on_association(:items)
      expect(association.macro).to eq(:has_many)
    end

    it 'destroys dependent items' do
      checklist = create(:checklist)
      create(:item, checklist: checklist)
      expect { checklist.destroy }.to change(Item, :count).by(-1)
    end
  end

  describe '#as_json' do
    it 'includes computed fields' do
      checklist = create(:checklist)
      create(:item, checklist: checklist, completed: true)
      create(:item, checklist: checklist, completed: false)
      create(:item, checklist: checklist, completed: false)

      json = checklist.as_json
      expect(json).to include(
        "items_count" => 3,
        "remaining_count" => 2,
        "progress_percentage" => 33.3
      )
    end
  end
end
