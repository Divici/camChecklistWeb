require 'rails_helper'

RSpec.describe "Api::V1::Items", type: :request do
  let(:checklist) { create(:checklist) }

  describe "GET /api/v1/checklists/:checklist_id/items" do
    it "returns all items for a checklist" do
      create_list(:item, 3, checklist: checklist)
      create(:item) # different checklist

      get "/api/v1/checklists/#{checklist.id}/items"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end
  end

  describe "POST /api/v1/checklists/:checklist_id/items" do
    it "creates an item" do
      post "/api/v1/checklists/#{checklist.id}/items",
           params: { item: { text: "New Item", priority: "high" } }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["text"]).to eq("New Item")
      expect(json["priority"]).to eq("high")
      expect(json["completed"]).to be false
    end

    it "returns errors with invalid params" do
      post "/api/v1/checklists/#{checklist.id}/items",
           params: { item: { text: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Text can't be blank")
    end
  end

  describe "PATCH /api/v1/checklists/:checklist_id/items/:id" do
    it "updates the item" do
      item = create(:item, checklist: checklist)
      patch "/api/v1/checklists/#{checklist.id}/items/#{item.id}",
            params: { item: { completed: true, completed_via: "manual" } }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["completed"]).to be true
      expect(json["completed_via"]).to eq("manual")
    end

    it "returns errors with invalid params" do
      item = create(:item, checklist: checklist)
      patch "/api/v1/checklists/#{checklist.id}/items/#{item.id}",
            params: { item: { text: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/checklists/:checklist_id/items/:id" do
    it "deletes the item" do
      item = create(:item, checklist: checklist)
      expect {
        delete "/api/v1/checklists/#{checklist.id}/items/#{item.id}"
      }.to change(Item, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
