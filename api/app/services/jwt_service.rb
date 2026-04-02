class JwtService
  SECRET = Rails.application.secret_key_base
  ACCESS_EXPIRY = 15.minutes
  REFRESH_EXPIRY = 30.days

  def self.encode(user_id, expiry: ACCESS_EXPIRY)
    payload = {
      user_id: user_id,
      exp: expiry.from_now.to_i
    }
    JWT.encode(payload, SECRET, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: "HS256")
    decoded.first
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  def self.generate_refresh_token(user)
    raw_token = SecureRandom.urlsafe_base64(32)
    family = SecureRandom.uuid

    user.refresh_tokens.create!(
      token_digest: Digest::SHA256.hexdigest(raw_token),
      expires_at: REFRESH_EXPIRY.from_now,
      family: family
    )

    raw_token
  end

  def self.rotate_refresh_token(raw_token)
    digest = Digest::SHA256.hexdigest(raw_token)
    existing = RefreshToken.find_by(token_digest: digest)

    return nil unless existing

    # Reuse detection: if token was already revoked, revoke entire family
    if existing.revoked?
      RefreshToken.revoke_family!(existing.family)
      return nil
    end

    return nil if existing.expired?

    existing.revoke!

    new_raw = SecureRandom.urlsafe_base64(32)
    existing.user.refresh_tokens.create!(
      token_digest: Digest::SHA256.hexdigest(new_raw),
      expires_at: REFRESH_EXPIRY.from_now,
      family: existing.family
    )

    { token: new_raw, user: existing.user }
  end

  def self.revoke_refresh_token(raw_token)
    digest = Digest::SHA256.hexdigest(raw_token)
    existing = RefreshToken.find_by(token_digest: digest)
    RefreshToken.revoke_family!(existing.family) if existing
  end
end
