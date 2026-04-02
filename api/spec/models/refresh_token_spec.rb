require "rails_helper"

RSpec.describe RefreshToken, type: :model do
  describe "validations" do
    subject { build(:refresh_token) }

    it { is_expected.to be_valid }

    it "requires token_digest" do
      subject.token_digest = nil
      expect(subject).not_to be_valid
    end

    it "requires expires_at" do
      subject.expires_at = nil
      expect(subject).not_to be_valid
    end

    it "requires family" do
      subject.family = nil
      expect(subject).not_to be_valid
    end

    it "requires unique token_digest" do
      create(:refresh_token, token_digest: "duplicate-digest")
      subject.token_digest = "duplicate-digest"
      expect(subject).not_to be_valid
    end
  end

  describe "associations" do
    it "belongs to user" do
      token = build(:refresh_token)
      expect(token.user).to be_present
    end
  end

  describe ".active" do
    it "returns non-revoked, non-expired tokens" do
      active = create(:refresh_token)
      create(:refresh_token, :expired)
      create(:refresh_token, :revoked)

      expect(RefreshToken.active).to eq([active])
    end
  end

  describe "#expired?" do
    it "returns true when expires_at is in the past" do
      token = build(:refresh_token, :expired)
      expect(token.expired?).to be true
    end

    it "returns false when expires_at is in the future" do
      token = build(:refresh_token)
      expect(token.expired?).to be false
    end
  end

  describe "#revoke!" do
    it "sets revoked to true" do
      token = create(:refresh_token)
      token.revoke!
      expect(token.reload.revoked).to be true
    end
  end

  describe ".revoke_family!" do
    it "revokes all tokens in the same family" do
      family_id = "shared-family"
      t1 = create(:refresh_token, family: family_id)
      t2 = create(:refresh_token, family: family_id)
      other = create(:refresh_token, family: "other-family")

      RefreshToken.revoke_family!(family_id)

      expect(t1.reload.revoked).to be true
      expect(t2.reload.revoked).to be true
      expect(other.reload.revoked).to be false
    end
  end
end
