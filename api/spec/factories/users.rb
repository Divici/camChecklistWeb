FactoryBot.define do
  factory :user do
    name { "Test User" }
    provider { "guest" }
    guest_token { SecureRandom.uuid }

    trait :google do
      provider { "google" }
      email { "test@example.com" }
      google_uid { SecureRandom.uuid }
      guest_token { nil }
    end
  end
end
