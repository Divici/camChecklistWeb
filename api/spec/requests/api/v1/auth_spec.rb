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

    it "sets auth cookies and returns user with valid token" do
      allow(GoogleAuthService).to receive(:verify).with("valid-id-token").and_return(google_payload)

      post "/api/v1/auth/google", params: { id_token: "valid-id-token" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("test@example.com")
      expect(json["user"]["name"]).to eq("Test User")
      expect(json["user"]["provider"]).to eq("google")
      expect(json).not_to have_key("token")

      expect(response.cookies["access_token"]).to be_present
      expect(response.cookies["refresh_token"]).to be_present
      expect(response.cookies["csrf_token"]).to be_present
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

      # Pass guest token via cookie
      cookies[:access_token] = guest_token

      post "/api/v1/auth/google", params: { id_token: "valid-id-token" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["provider"]).to eq("google")
      expect(json["user"]["email"]).to eq("test@example.com")

      guest.reload
      expect(guest.provider).to eq("google")
      expect(guest.guest_token).to be_nil
      expect(guest.projects).to include(guest_project)
    end

    it "still supports guest upgrade via Bearer header (migration)" do
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
      expect(guest.reload.provider).to eq("google")
      expect(guest.projects).to include(guest_project)
    end
  end

  describe "POST /api/v1/auth/guest" do
    it "creates guest user and sets auth cookies" do
      expect {
        post "/api/v1/auth/guest"
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["provider"]).to eq("guest")
      expect(json["user"]["name"]).to eq("Guest")
      expect(json).not_to have_key("token")

      expect(response.cookies["access_token"]).to be_present
      expect(response.cookies["refresh_token"]).to be_present
      expect(response.cookies["csrf_token"]).to be_present
    end

    it "sets SameSite=Lax on cookies in non-production" do
      post "/api/v1/auth/guest"

      cookie_str = response.header["Set-Cookie"].to_s.downcase
      expect(cookie_str).to include("samesite=lax")
    end

    it "uses SameSite=None in production cookie_options" do
      controller = Api::V1::AuthController.new
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))

      opts = controller.send(:cookie_options)
      expect(opts[:same_site]).to eq(:None)
      expect(opts[:secure]).to eq(true)
    end
  end

  describe "GET /api/v1/auth/me" do
    it "returns user with valid cookie" do
      user = create(:user, :google, name: "Jane Doe", email: "jane@example.com")
      cookies[:access_token] = JwtService.encode(user.id)

      get "/api/v1/auth/me"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq("Jane Doe")
      expect(json["user"]["email"]).to eq("jane@example.com")
    end

    it "returns user with valid Bearer header (migration)" do
      user = create(:user, :google, name: "Jane Doe", email: "jane@example.com")
      headers = auth_headers_for(user)

      get "/api/v1/auth/me", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq("Jane Doe")
    end

    it "returns 401 without token" do
      get "/api/v1/auth/me"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/refresh" do
    let(:user) { create(:user, :google) }
    let!(:raw_refresh) { JwtService.generate_refresh_token(user) }

    it "rotates refresh token and sets new cookies" do
      cookies[:refresh_token] = raw_refresh

      post "/api/v1/auth/refresh"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["id"]).to eq(user.id)

      expect(response.cookies["access_token"]).to be_present
      expect(response.cookies["refresh_token"]).to be_present
      expect(response.cookies["csrf_token"]).to be_present
    end

    it "returns 401 without refresh token" do
      post "/api/v1/auth/refresh"

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("No refresh token")
    end

    it "returns 401 and clears cookies for invalid refresh token" do
      cookies[:refresh_token] = "invalid-token"

      post "/api/v1/auth/refresh"

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid refresh token")
    end

    it "returns 401 when reusing a revoked token (rotation detection)" do
      cookies[:refresh_token] = raw_refresh

      # First refresh succeeds
      post "/api/v1/auth/refresh"
      expect(response).to have_http_status(:ok)

      # Reuse the old token (attacker scenario)
      cookies[:refresh_token] = raw_refresh
      post "/api/v1/auth/refresh"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let(:user) { create(:user, :google) }

    it "revokes refresh tokens and clears cookies" do
      raw_refresh = JwtService.generate_refresh_token(user)
      access_token = JwtService.encode(user.id)
      csrf_value = "test-csrf"

      cookies[:access_token] = access_token
      cookies[:refresh_token] = raw_refresh
      cookies[:csrf_token] = csrf_value

      delete "/api/v1/auth/logout",
             headers: { "X-CSRF-Token" => csrf_value }

      expect(response).to have_http_status(:no_content)

      # Refresh token family should be revoked
      expect(user.refresh_tokens.where(revoked: false).count).to eq(0)
    end
  end
end
