module AuthHelpers
  # Bearer token auth (used by existing request specs during migration)
  def auth_headers_for(user)
    token = JwtService.encode(user.id)
    { "Authorization" => "Bearer #{token}" }
  end

  # Cookie-based auth for new specs
  def auth_cookies_for(user)
    { access_token: JwtService.encode(user.id) }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
