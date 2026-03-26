class Item < ApplicationRecord
  belongs_to :checklist

  validates :text, presence: true
end
