require "net/http"
require "json"

class GoogleAuthService
  GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/tokeninfo"

  def self.verify(id_token)
    uri = URI("#{GOOGLE_CERTS_URL}?id_token=#{id_token}")
    response = Net::HTTP.get_response(uri)

    return nil unless response.is_a?(Net::HTTPSuccess)

    payload = JSON.parse(response.body)
    client_id = ENV.fetch("GOOGLE_CLIENT_ID", "")

    # Verify the token was intended for our app
    unless payload["aud"] == client_id
      Rails.logger.warn("Google token aud mismatch: #{payload['aud']} != #{client_id}")
      return nil
    end

    payload
  rescue JSON::ParserError, StandardError => e
    Rails.logger.error("Google auth verification failed: #{e.message}")
    nil
  end
end
