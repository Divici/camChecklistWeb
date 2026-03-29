class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
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

  def current_user
    @current_user
  end
end
