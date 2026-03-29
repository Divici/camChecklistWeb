class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email
      t.string :name
      t.string :avatar_url
      t.string :google_uid
      t.string :provider, default: "guest", null: false
      t.string :guest_token
      t.timestamps
    end

    add_index :users, :google_uid, unique: true, where: "google_uid IS NOT NULL"
    add_index :users, :guest_token, unique: true, where: "guest_token IS NOT NULL"
  end
end
