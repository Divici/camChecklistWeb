FactoryBot.define do
  factory :item do
    association :checklist
    sequence(:text) { |n| "Item #{n}" }
    completed { false }
    priority { "normal" }
    position { 1 }
  end
end
