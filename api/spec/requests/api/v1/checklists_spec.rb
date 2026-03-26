require 'rails_helper'

RSpec.describe "Api::V1::Checklists", type: :request do
  let(:project) { create(:project) }

  describe "GET /api/v1/projects/:project_id/checklists" do
    it "returns all checklists for a project" do
      create_list(:checklist, 3, project: project)
      create(:checklist) # different project

      get "/api/v1/projects/#{project.id}/checklists"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end

    it "includes computed fields" do
      checklist = create(:checklist, project: project)
      create(:item, checklist: checklist, completed: true)
      create(:item, checklist: checklist, completed: false)

      get "/api/v1/projects/#{project.id}/checklists"

      json = JSON.parse(response.body)
      expect(json.first).to include(
        "items_count" => 2,
        "remaining_count" => 1,
        "progress_percentage" => 50.0
      )
    end
  end

  describe "GET /api/v1/projects/:project_id/checklists/:id" do
    it "returns the checklist" do
      checklist = create(:checklist, project: project, name: "My Checklist")
      get "/api/v1/projects/#{project.id}/checklists/#{checklist.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("My Checklist")
    end

    it "returns 404 for non-existent checklist" do
      get "/api/v1/projects/#{project.id}/checklists/999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/projects/:project_id/checklists" do
    it "creates a checklist" do
      post "/api/v1/projects/#{project.id}/checklists",
           params: { checklist: { name: "New Checklist", description: "Desc", icon: "star" } }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Checklist")
      expect(json["project_id"]).to eq(project.id)
    end

    it "returns errors with invalid params" do
      post "/api/v1/projects/#{project.id}/checklists",
           params: { checklist: { name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Name can't be blank")
    end
  end

  describe "PATCH /api/v1/projects/:project_id/checklists/:id" do
    it "updates the checklist" do
      checklist = create(:checklist, project: project)
      patch "/api/v1/projects/#{project.id}/checklists/#{checklist.id}",
            params: { checklist: { name: "Updated" } }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/projects/:project_id/checklists/:id" do
    it "deletes the checklist" do
      checklist = create(:checklist, project: project)
      expect {
        delete "/api/v1/projects/#{project.id}/checklists/#{checklist.id}"
      }.to change(Checklist, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
