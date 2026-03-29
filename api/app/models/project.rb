class Project < ApplicationRecord
  belongs_to :user, optional: true
  has_many :checklists, dependent: :destroy
  has_many :items, through: :checklists

  validates :name, presence: true

  def as_json(options = {})
    super(options.merge(only: [:id, :name, :status, :created_at, :updated_at])).merge(
      "checklists_count" => checklists.size,
      "items_count" => items.size,
      "completed_items_count" => items.where(completed: true).size,
      "progress_percentage" => progress_percentage
    )
  end

  private

  def progress_percentage
    total = items.size
    return 0 if total.zero?
    ((items.where(completed: true).size.to_f / total) * 100).round(1)
  end
end
