module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:google, :guest]

      # POST /api/v1/auth/google
      def google
        id_token = params.require(:id_token)
        payload = GoogleAuthService.verify(id_token)

        unless payload
          return render json: { error: "Invalid Google token" }, status: :unauthorized
        end

        # If a guest JWT is provided, upgrade that guest account
        existing_guest = extract_guest_user
        if existing_guest
          # Check if a Google account already exists for this sub
          existing_google = User.find_by(google_uid: payload["sub"])
          if existing_google
            # Merge guest projects into existing Google account
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

        token = JwtService.encode(user.id)
        render json: { token: token, user: user_json(user) }
      end

      # POST /api/v1/auth/guest
      def guest
        user = User.create_guest
        token = JwtService.encode(user.id)
        render json: { token: token, user: user_json(user) }
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_json(current_user) }
      end

      private

      def extract_guest_user
        token = request.headers["Authorization"]&.split(" ")&.last
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
