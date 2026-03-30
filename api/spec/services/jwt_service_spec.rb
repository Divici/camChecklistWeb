require 'rails_helper'

RSpec.describe JwtService do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user) }

  describe ".encode" do
    it "returns a string token" do
      token = described_class.encode(user.id)
      expect(token).to be_a(String)
      expect(token).not_to be_empty
    end

    it "includes user_id in payload" do
      token = described_class.encode(user.id)
      decoded = JWT.decode(token, described_class::SECRET, true, algorithm: "HS256").first
      expect(decoded["user_id"]).to eq(user.id)
    end

    it "sets 30-day expiration" do
      freeze_time = Time.current
      allow(Time).to receive(:current).and_return(freeze_time)

      token = described_class.encode(user.id)
      decoded = JWT.decode(token, described_class::SECRET, true, algorithm: "HS256").first

      expected_exp = 30.days.from_now.to_i
      expect(decoded["exp"]).to be_within(2).of(expected_exp)
    end
  end

  describe ".decode" do
    it "returns payload with user_id" do
      token = described_class.encode(user.id)
      payload = described_class.decode(token)

      expect(payload).to be_a(Hash)
      expect(payload["user_id"]).to eq(user.id)
    end

    it "returns nil for invalid token" do
      result = described_class.decode("invalid.token.here")
      expect(result).to be_nil
    end

    it "returns nil for expired token" do
      token = described_class.encode(user.id)

      travel_to 31.days.from_now do
        result = described_class.decode(token)
        expect(result).to be_nil
      end
    end

    it "returns nil for tampered token" do
      token = described_class.encode(user.id)
      parts = token.split(".")
      # Tamper with the payload
      parts[1] = Base64.urlsafe_encode64('{"user_id":999,"exp":9999999999}')
      tampered = parts.join(".")

      result = described_class.decode(tampered)
      expect(result).to be_nil
    end
  end
end
