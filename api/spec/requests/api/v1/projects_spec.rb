require 'rails_helper'

RSpec.describe "Api::V1::Projects", type: :request do
  include_context "authenticated"

  describe "GET /api/v1/projects" do
    it "returns all projects for the current user" do
      create_list(:project, 3, user: current_user)
      create(:project) # different user
      get "/api/v1/projects", headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end

    it "includes computed fields" do
      project = create(:project, user: current_user)
      checklist = create(:checklist, project: project)
      create(:item, checklist: checklist, completed: true)
      create(:item, checklist: checklist, completed: false)

      get "/api/v1/projects", headers: auth_headers

      json = JSON.parse(response.body)
      expect(json.first).to include(
        "checklists_count" => 1,
        "items_count" => 2,
        "completed_items_count" => 1,
        "progress_percentage" => 50.0
      )
    end

    it "returns 401 without auth headers" do
      get "/api/v1/projects"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/projects/:id" do
    it "returns the project" do
      project = create(:project, name: "Test Project", user: current_user)
      get "/api/v1/projects/#{project.id}", headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Test Project")
    end

    it "returns 404 for non-existent project" do
      get "/api/v1/projects/999", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for another user's project" do
      other_project = create(:project)
      get "/api/v1/projects/#{other_project.id}", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/projects" do
    it "creates a project with valid params" do
      post "/api/v1/projects", params: { project: { name: "New Project" } }, headers: auth_headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Project")
      expect(json["status"]).to eq("in_progress")
    end

    it "returns errors with invalid params" do
      post "/api/v1/projects", params: { project: { name: "" } }, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Name can't be blank")
    end
  end

  describe "PATCH /api/v1/projects/:id" do
    it "updates the project" do
      project = create(:project, name: "Old Name", user: current_user)
      patch "/api/v1/projects/#{project.id}", params: { project: { name: "New Name" } }, headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Name")
    end

    it "returns errors with invalid params" do
      project = create(:project, user: current_user)
      patch "/api/v1/projects/#{project.id}", params: { project: { name: "" } }, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/projects/:id" do
    it "deletes the project" do
      project = create(:project, user: current_user)
      expect {
        delete "/api/v1/projects/#{project.id}", headers: auth_headers
      }.to change(Project, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
