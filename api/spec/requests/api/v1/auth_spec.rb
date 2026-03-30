require 'rails_helper'

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/google" do
    let(:google_payload) do
      {
        "sub" => "google-uid-123",
        "email" => "test@example.com",
        "name" => "Test User",
        "picture" => "https://example.com/avatar.jpg"
      }
    end

    it "returns JWT and user with valid token" do
      allow(GoogleAuthService).to receive(:verify).with("valid-id-token").and_return(google_payload)

      post "/api/v1/auth/google", params: { id_token: "valid-id-token" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["token"]).to be_present
      expect(json["user"]["email"]).to eq("test@example.com")
      expect(json["user"]["name"]).to eq("Test User")
      expect(json["user"]["provider"]).to eq("google")
    end

    it "returns 401 with invalid token" do
      allow(GoogleAuthService).to receive(:verify).with("bad-token").and_return(nil)

      post "/api/v1/auth/google", params: { id_token: "bad-token" }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid Google token")
    end

    it "upgrades guest account when current user is guest" do
      guest = User.create_guest
      guest_token = JwtService.encode(guest.id)
      guest_project = create(:project, user: guest)

      allow(GoogleAuthService).to receive(:verify).with("valid-id-token").and_return(google_payload)

      post "/api/v1/auth/google",
           params: { id_token: "valid-id-token" },
           headers: { "Authorization" => "Bearer #{guest_token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["provider"]).to eq("google")
      expect(json["user"]["email"]).to eq("test@example.com")

      guest.reload
      expect(guest.provider).to eq("google")
      expect(guest.guest_token).to be_nil
      expect(guest.projects).to include(guest_project)
    end
  end

  describe "POST /api/v1/auth/guest" do
    it "creates guest user and returns JWT" do
      expect {
        post "/api/v1/auth/guest"
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["token"]).to be_present
      expect(json["user"]["provider"]).to eq("guest")
      expect(json["user"]["name"]).to eq("Guest")
    end
  end

  describe "GET /api/v1/auth/me" do
    it "returns user with valid token" do
      user = create(:user, :google, name: "Jane Doe", email: "jane@example.com")
      headers = auth_headers_for(user)

      get "/api/v1/auth/me", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq("Jane Doe")
      expect(json["user"]["email"]).to eq("jane@example.com")
    end

    it "returns 401 without token" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
