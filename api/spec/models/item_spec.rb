require 'rails_helper'

RSpec.describe Item, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      item = build(:item)
      expect(item).to be_valid
    end

    it 'is invalid without text' do
      item = build(:item, text: nil)
      expect(item).not_to be_valid
      expect(item.errors[:text]).to include("can't be blank")
    end
  end

  describe 'associations' do
    it 'belongs to a checklist' do
      association = described_class.reflect_on_association(:checklist)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe 'defaults' do
    it 'defaults completed to false' do
      item = create(:item)
      expect(item.completed).to be false
    end

    it 'defaults priority to normal' do
      item = create(:item)
      expect(item.priority).to eq("normal")
    end
  end
end
