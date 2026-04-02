# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_02_000001) do
  create_table "checklists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "icon"
    t.string "name", null: false
    t.integer "position"
    t.integer "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_checklists_on_project_id"
  end

  create_table "items", force: :cascade do |t|
    t.integer "checklist_id", null: false
    t.boolean "completed", default: false
    t.datetime "completed_at"
    t.string "completed_via"
    t.datetime "created_at", null: false
    t.integer "position"
    t.string "priority", default: "normal"
    t.string "text", null: false
    t.datetime "updated_at", null: false
    t.index ["checklist_id"], name: "index_items_on_checklist_id"
  end

  create_table "projects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "status", default: "in_progress"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["user_id"], name: "index_projects_on_user_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "family", null: false
    t.boolean "revoked", default: false, null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["family"], name: "index_refresh_tokens_on_family"
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "google_uid"
    t.string "guest_token"
    t.string "name"
    t.string "provider", default: "guest", null: false
    t.datetime "updated_at", null: false
    t.index ["google_uid"], name: "index_users_on_google_uid", unique: true, where: "google_uid IS NOT NULL"
    t.index ["guest_token"], name: "index_users_on_guest_token", unique: true, where: "guest_token IS NOT NULL"
  end

  add_foreign_key "checklists", "projects"
  add_foreign_key "items", "checklists"
  add_foreign_key "projects", "users"
  add_foreign_key "refresh_tokens", "users"
end
