require 'rails_helper'

RSpec.describe "Api::V1::Projects", type: :request do
  describe "GET /api/v1/projects" do
    it "returns all projects" do
      create_list(:project, 3)
      get "/api/v1/projects"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end

    it "includes computed fields" do
      project = create(:project)
      checklist = create(:checklist, project: project)
      create(:item, checklist: checklist, completed: true)
      create(:item, checklist: checklist, completed: false)

      get "/api/v1/projects"

      json = JSON.parse(response.body)
      expect(json.first).to include(
        "checklists_count" => 1,
        "items_count" => 2,
        "completed_items_count" => 1,
        "progress_percentage" => 50.0
      )
    end
  end

  describe "GET /api/v1/projects/:id" do
    it "returns the project" do
      project = create(:project, name: "Test Project")
      get "/api/v1/projects/#{project.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Test Project")
    end

    it "returns 404 for non-existent project" do
      get "/api/v1/projects/999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/projects" do
    it "creates a project with valid params" do
      post "/api/v1/projects", params: { project: { name: "New Project" } }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Project")
      expect(json["status"]).to eq("in_progress")
    end

    it "returns errors with invalid params" do
      post "/api/v1/projects", params: { project: { name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Name can't be blank")
    end
  end

  describe "PATCH /api/v1/projects/:id" do
    it "updates the project" do
      project = create(:project, name: "Old Name")
      patch "/api/v1/projects/#{project.id}", params: { project: { name: "New Name" } }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Name")
    end

    it "returns errors with invalid params" do
      project = create(:project)
      patch "/api/v1/projects/#{project.id}", params: { project: { name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/projects/:id" do
    it "deletes the project" do
      project = create(:project)
      expect { delete "/api/v1/projects/#{project.id}" }.to change(Project, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
