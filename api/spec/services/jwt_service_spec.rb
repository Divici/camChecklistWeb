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

    it "sets 15-minute expiration by default" do
      freeze_time do
        token = described_class.encode(user.id)
        decoded = JWT.decode(token, described_class::SECRET, true, algorithm: "HS256").first
        expected_exp = 15.minutes.from_now.to_i
        expect(decoded["exp"]).to be_within(2).of(expected_exp)
      end
    end

    it "accepts custom expiry" do
      freeze_time do
        token = described_class.encode(user.id, expiry: 1.hour)
        decoded = JWT.decode(token, described_class::SECRET, true, algorithm: "HS256").first
        expected_exp = 1.hour.from_now.to_i
        expect(decoded["exp"]).to be_within(2).of(expected_exp)
      end
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

      travel_to 16.minutes.from_now do
        result = described_class.decode(token)
        expect(result).to be_nil
      end
    end

    it "returns nil for tampered token" do
      token = described_class.encode(user.id)
      parts = token.split(".")
      parts[1] = Base64.urlsafe_encode64('{"user_id":999,"exp":9999999999}')
      tampered = parts.join(".")

      result = described_class.decode(tampered)
      expect(result).to be_nil
    end
  end

  describe ".generate_refresh_token" do
    it "returns a raw token string" do
      raw = described_class.generate_refresh_token(user)
      expect(raw).to be_a(String)
      expect(raw).not_to be_empty
    end

    it "creates a RefreshToken record in the database" do
      expect {
        described_class.generate_refresh_token(user)
      }.to change(RefreshToken, :count).by(1)
    end

    it "stores the SHA256 digest, not the raw token" do
      raw = described_class.generate_refresh_token(user)
      digest = Digest::SHA256.hexdigest(raw)
      expect(RefreshToken.find_by(token_digest: digest)).to be_present
    end

    it "sets a 30-day expiration" do
      freeze_time do
        described_class.generate_refresh_token(user)
        token = RefreshToken.last
        expect(token.expires_at).to be_within(2.seconds).of(30.days.from_now)
      end
    end
  end

  describe ".rotate_refresh_token" do
    let!(:raw_token) { described_class.generate_refresh_token(user) }

    it "returns new token and user on success" do
      result = described_class.rotate_refresh_token(raw_token)
      expect(result).to be_a(Hash)
      expect(result[:token]).to be_a(String)
      expect(result[:user]).to eq(user)
    end

    it "revokes the old token" do
      digest = Digest::SHA256.hexdigest(raw_token)
      described_class.rotate_refresh_token(raw_token)
      expect(RefreshToken.find_by(token_digest: digest).revoked).to be true
    end

    it "creates a new token in the same family" do
      old_record = RefreshToken.last
      result = described_class.rotate_refresh_token(raw_token)
      new_digest = Digest::SHA256.hexdigest(result[:token])
      new_record = RefreshToken.find_by(token_digest: new_digest)
      expect(new_record.family).to eq(old_record.family)
    end

    it "returns nil for nonexistent token" do
      result = described_class.rotate_refresh_token("nonexistent")
      expect(result).to be_nil
    end

    it "returns nil for expired token" do
      token_record = RefreshToken.last
      token_record.update!(expires_at: 1.hour.ago)

      result = described_class.rotate_refresh_token(raw_token)
      expect(result).to be_nil
    end

    it "returns nil and revokes family on reuse of revoked token" do
      # First rotation succeeds
      result1 = described_class.rotate_refresh_token(raw_token)
      expect(result1).to be_present

      # Reusing the old (now revoked) token triggers family revocation
      result2 = described_class.rotate_refresh_token(raw_token)
      expect(result2).to be_nil

      # The new token from result1 should also be revoked
      new_digest = Digest::SHA256.hexdigest(result1[:token])
      expect(RefreshToken.find_by(token_digest: new_digest).revoked).to be true
    end
  end

  describe ".revoke_refresh_token" do
    it "revokes all tokens in the family" do
      raw = described_class.generate_refresh_token(user)
      family = RefreshToken.last.family

      # Create another token in the same family
      user.refresh_tokens.create!(
        token_digest: Digest::SHA256.hexdigest("other"),
        expires_at: 30.days.from_now,
        family: family
      )

      described_class.revoke_refresh_token(raw)

      user.refresh_tokens.reload.each do |t|
        expect(t.revoked).to be true
      end
    end

    it "does nothing for nonexistent token" do
      expect {
        described_class.revoke_refresh_token("nonexistent")
      }.not_to raise_error
    end
  end
end
