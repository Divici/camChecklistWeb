module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:google, :guest, :refresh]
      skip_before_action :verify_csrf_token!, only: [:google, :guest, :refresh]

      # POST /api/v1/auth/google
      def google
        id_token = params.require(:id_token)
        payload = GoogleAuthService.verify(id_token)

        unless payload
          return render json: { error: "Invalid Google token" }, status: :unauthorized
        end

        existing_guest = extract_guest_user
        if existing_guest
          existing_google = User.find_by(google_uid: payload["sub"])
          if existing_google
            existing_guest.projects.update_all(user_id: existing_google.id)
            existing_guest.destroy
            user = existing_google
          else
            existing_guest.upgrade_from_guest!(payload)
            user = existing_guest
          end
        else
          user = User.find_or_create_from_google(payload)
        end

        set_auth_cookies(user)
        set_csrf_cookie(user.id)
        render json: { user: user_json(user) }
      end

      # POST /api/v1/auth/guest
      def guest
        user = User.create_guest
        set_auth_cookies(user)
        set_csrf_cookie(user.id)
        render json: { user: user_json(user) }
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_json(current_user) }
      end

      # POST /api/v1/auth/refresh
      def refresh
        raw_token = cookies[:refresh_token]
        unless raw_token
          return render json: { error: "No refresh token" }, status: :unauthorized
        end

        result = JwtService.rotate_refresh_token(raw_token)
        unless result
          clear_auth_cookies
          return render json: { error: "Invalid refresh token" }, status: :unauthorized
        end

        user = result[:user]
        cookies[:access_token] = COOKIE_OPTIONS.merge(
          value: JwtService.encode(user.id),
          expires: 15.minutes.from_now
        )
        cookies[:refresh_token] = COOKIE_OPTIONS.merge(
          value: result[:token],
          expires: 30.days.from_now
        )
        set_csrf_cookie(user.id)

        render json: { user: user_json(user) }
      end

      # DELETE /api/v1/auth/logout
      def logout
        raw_token = cookies[:refresh_token]
        JwtService.revoke_refresh_token(raw_token) if raw_token
        clear_auth_cookies
        head :no_content
      end

      private

      def extract_guest_user
        token = cookies[:access_token] || request.headers["Authorization"]&.split(" ")&.last
        return nil unless token
        payload = JwtService.decode(token)
        return nil unless payload
        user = User.find_by(id: payload["user_id"])
        user&.provider == "guest" ? user : nil
      rescue
        nil
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          provider: user.provider
        }
      end
    end
  end
end
