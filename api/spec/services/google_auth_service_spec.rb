require 'rails_helper'

RSpec.describe GoogleAuthService do
  let(:valid_payload) do
    {
      "sub" => "google-uid-123",
      "email" => "test@example.com",
      "name" => "Test User",
      "picture" => "https://example.com/avatar.jpg",
      "aud" => "test-client-id"
    }
  end

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("GOOGLE_CLIENT_ID", "").and_return("test-client-id")
  end

  describe ".verify" do
    it "returns payload for valid token" do
      stub_request(:get, /googleapis.com\/oauth2\/v3\/tokeninfo/)
        .to_return(status: 200, body: valid_payload.to_json, headers: { "Content-Type" => "application/json" })

      result = described_class.verify("valid-id-token")

      expect(result).to be_a(Hash)
      expect(result["sub"]).to eq("google-uid-123")
      expect(result["email"]).to eq("test@example.com")
    end

    it "returns nil for invalid token (HTTP error)" do
      stub_request(:get, /googleapis.com\/oauth2\/v3\/tokeninfo/)
        .to_return(status: 400, body: '{"error": "invalid_token"}')

      result = described_class.verify("invalid-token")

      expect(result).to be_nil
    end

    it "returns nil when audience doesn't match" do
      mismatched_payload = valid_payload.merge("aud" => "wrong-client-id")
      stub_request(:get, /googleapis.com\/oauth2\/v3\/tokeninfo/)
        .to_return(status: 200, body: mismatched_payload.to_json, headers: { "Content-Type" => "application/json" })

      result = described_class.verify("valid-token-wrong-aud")

      expect(result).to be_nil
    end

    it "returns nil on network error" do
      stub_request(:get, /googleapis.com\/oauth2\/v3\/tokeninfo/)
        .to_raise(Errno::ECONNREFUSED)

      result = described_class.verify("any-token")

      expect(result).to be_nil
    end

    it "logs errors on failure" do
      stub_request(:get, /googleapis.com\/oauth2\/v3\/tokeninfo/)
        .to_raise(StandardError.new("connection timeout"))

      expect(Rails.logger).to receive(:error).with(/Google auth verification failed: connection timeout/)

      described_class.verify("any-token")
    end
  end
end
