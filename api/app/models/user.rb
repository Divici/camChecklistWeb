class User < ApplicationRecord
  has_many :projects, dependent: :destroy
  has_many :checklists, through: :projects
  has_many :items, through: :checklists

  validates :google_uid, uniqueness: true, allow_nil: true
  validates :provider, presence: true, inclusion: { in: %w[google guest] }

  def self.find_or_create_from_google(payload)
    user = find_by(google_uid: payload["sub"])
    if user
      user.update!(
        email: payload["email"],
        name: payload["name"],
        avatar_url: payload["picture"]
      )
      user
    else
      create!(
        google_uid: payload["sub"],
        email: payload["email"],
        name: payload["name"],
        avatar_url: payload["picture"],
        provider: "google"
      )
    end
  end

  def self.create_guest
    create!(
      provider: "guest",
      name: "Guest",
      guest_token: SecureRandom.uuid
    )
  end

  def upgrade_from_guest!(google_payload)
    update!(
      google_uid: google_payload["sub"],
      email: google_payload["email"],
      name: google_payload["name"],
      avatar_url: google_payload["picture"],
      provider: "google",
      guest_token: nil
    )
  end
end
