module AuthHelpers
  def auth_headers_for(user)
    token = JwtService.encode(user.id)
    { "Authorization" => "Bearer #{token}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
