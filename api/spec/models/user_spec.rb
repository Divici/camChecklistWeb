require 'rails_helper'

RSpec.describe User, type: :model do
  describe ".find_or_create_from_google" do
    let(:google_payload) do
      {
        "sub" => "google-uid-123",
        "email" => "test@example.com",
        "name" => "Test User",
        "picture" => "https://example.com/avatar.jpg"
      }
    end

    it "creates a new user from Google payload" do
      expect {
        user = described_class.find_or_create_from_google(google_payload)
        expect(user).to be_persisted
        expect(user.google_uid).to eq("google-uid-123")
        expect(user.email).to eq("test@example.com")
        expect(user.name).to eq("Test User")
        expect(user.avatar_url).to eq("https://example.com/avatar.jpg")
        expect(user.provider).to eq("google")
      }.to change(described_class, :count).by(1)
    end

    it "finds existing user by google_uid" do
      existing = create(:user, :google, google_uid: "google-uid-123")

      expect {
        user = described_class.find_or_create_from_google(google_payload)
        expect(user.id).to eq(existing.id)
      }.not_to change(described_class, :count)
    end

    it "updates existing user's profile" do
      existing = create(:user, :google, google_uid: "google-uid-123", name: "Old Name", email: "old@example.com")

      user = described_class.find_or_create_from_google(google_payload)

      expect(user.name).to eq("Test User")
      expect(user.email).to eq("test@example.com")
      expect(user.avatar_url).to eq("https://example.com/avatar.jpg")
    end
  end

  describe ".create_guest" do
    it "creates user with provider=guest and UUID guest_token" do
      user = described_class.create_guest

      expect(user).to be_persisted
      expect(user.provider).to eq("guest")
      expect(user.name).to eq("Guest")
      expect(user.guest_token).to be_present
      expect(user.guest_token).to match(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
    end
  end

  describe "#upgrade_from_guest!" do
    let(:guest_user) { create(:user, provider: "guest", guest_token: SecureRandom.uuid) }
    let(:google_payload) do
      {
        "sub" => "google-uid-456",
        "email" => "upgraded@example.com",
        "name" => "Upgraded User",
        "picture" => "https://example.com/new-avatar.jpg"
      }
    end

    it "converts provider to google, sets google_uid, clears guest_token" do
      guest_user.upgrade_from_guest!(google_payload)

      guest_user.reload
      expect(guest_user.provider).to eq("google")
      expect(guest_user.google_uid).to eq("google-uid-456")
      expect(guest_user.email).to eq("upgraded@example.com")
      expect(guest_user.name).to eq("Upgraded User")
      expect(guest_user.avatar_url).to eq("https://example.com/new-avatar.jpg")
      expect(guest_user.guest_token).to be_nil
    end
  end
end
