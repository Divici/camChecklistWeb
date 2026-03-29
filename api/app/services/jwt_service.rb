class JwtService
  SECRET = Rails.application.secret_key_base

  def self.encode(user_id)
    payload = {
      user_id: user_id,
      exp: 30.days.from_now.to_i
    }
    JWT.encode(payload, SECRET, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: "HS256")
    decoded.first
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
