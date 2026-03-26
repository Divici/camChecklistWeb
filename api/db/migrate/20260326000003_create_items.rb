class CreateItems < ActiveRecord::Migration[8.0]
  def change
    create_table :items do |t|
      t.references :checklist, null: false, foreign_key: true
      t.string :text, null: false
      t.boolean :completed, default: false
      t.string :completed_via
      t.datetime :completed_at
      t.integer :position
      t.string :priority, default: "normal"

      t.timestamps
    end
  end
end
