FactoryBot.define do
  factory :refresh_token do
    user
    token_digest { Digest::SHA256.hexdigest(SecureRandom.urlsafe_base64(32)) }
    expires_at { 30.days.from_now }
    family { SecureRandom.uuid }
    revoked { false }

    trait :expired do
      expires_at { 1.hour.ago }
    end

    trait :revoked do
      revoked { true }
    end
  end
end
