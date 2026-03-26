class Checklist < ApplicationRecord
  belongs_to :project
  has_many :items, dependent: :destroy

  validates :name, presence: true

  def as_json(options = {})
    super(options.merge(only: [:id, :project_id, :name, :description, :icon, :position, :created_at, :updated_at])).merge(
      "items_count" => items.size,
      "remaining_count" => items.where(completed: false).size,
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
