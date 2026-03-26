FactoryBot.define do
  factory :checklist do
    association :project
    sequence(:name) { |n| "Checklist #{n}" }
    description { "A test checklist" }
    icon { "clipboard" }
    position { 1 }
  end
end
