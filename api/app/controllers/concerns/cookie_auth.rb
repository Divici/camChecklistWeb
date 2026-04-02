module CookieAuth
  extend ActiveSupport::Concern

  private

  def cookie_options
    {
      httponly: true,
      secure: Rails.env.production?,
      same_site: Rails.env.production? ? :None : :Lax,
      path: "/"
    }
  end

  def set_auth_cookies(user)
    access_token = JwtService.encode(user.id)
    refresh_token = JwtService.generate_refresh_token(user)

    cookies[:access_token] = cookie_options.merge(
      value: access_token,
      expires: 15.minutes.from_now
    )
    cookies[:refresh_token] = cookie_options.merge(
      value: refresh_token,
      expires: 30.days.from_now
    )
  end

  def clear_auth_cookies
    cookies.delete(:access_token, path: "/")
    cookies.delete(:refresh_token, path: "/")
    cookies.delete(:csrf_token, path: "/")
  end

  def set_csrf_cookie(user_id)
    cookies[:csrf_token] = cookie_options.merge(
      value: generate_csrf_token(user_id),
      httponly: false
    )
  end

  def generate_csrf_token(user_id)
    data = "#{user_id}:#{Time.current.to_i / 3600}"
    OpenSSL::HMAC.hexdigest("SHA256", Rails.application.secret_key_base, data)
  end

  def verify_csrf_token!
    return if request.get? || request.head? || request.options?

    # Bearer token auth is inherently CSRF-safe (not auto-sent by browsers)
    return if request.headers["Authorization"].present?

    # Only enforce CSRF for cookie-based auth
    return unless cookies[:access_token].present?

    csrf_cookie = cookies[:csrf_token]
    csrf_header = request.headers["X-CSRF-Token"]

    unless csrf_cookie.present? && csrf_header.present? && ActiveSupport::SecurityUtils.secure_compare(csrf_cookie, csrf_header)
      render json: { error: "Invalid CSRF token" }, status: :forbidden
    end
  end
end
