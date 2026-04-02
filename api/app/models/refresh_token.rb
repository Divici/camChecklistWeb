class RefreshToken < ApplicationRecord
  belongs_to :user

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at, presence: true
  validates :family, presence: true

  scope :active, -> { where(revoked: false).where("expires_at > ?", Time.current) }

  def expired?
    expires_at < Time.current
  end

  def revoke!
    update!(revoked: true)
  end

  def self.revoke_family!(family)
    where(family: family).update_all(revoked: true)
  end
end
