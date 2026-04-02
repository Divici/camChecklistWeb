class ApplicationController < ActionController::API
  include ActionController::Cookies
  include CookieAuth

  before_action :authenticate_user!
  before_action :verify_csrf_token!

  private

  def authenticate_user!
    token = cookies[:access_token] || extract_bearer_token

    unless token
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    payload = JwtService.decode(token)
    unless payload
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    @current_user = User.find_by(id: payload["user_id"])
    unless @current_user
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def extract_bearer_token
    request.headers["Authorization"]&.split(" ")&.last
  end

  def current_user
    @current_user
  end
end
