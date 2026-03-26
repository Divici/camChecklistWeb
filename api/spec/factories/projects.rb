FactoryBot.define do
  factory :project do
    sequence(:name) { |n| "Project #{n}" }
    status { "in_progress" }
  end
end
