module Api
  module V1
    class ChecklistsController < ApplicationController
      before_action :set_project
      before_action :set_checklist, only: [:show, :update, :destroy]

      def index
        @checklists = @project.checklists.order(:position, :created_at)
        render json: @checklists
      end

      def show
        render json: @checklist
      end

      def create
        @checklist = @project.checklists.build(checklist_params)
        if @checklist.save
          render json: @checklist, status: :created
        else
          render json: { errors: @checklist.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @checklist.update(checklist_params)
          render json: @checklist
        else
          render json: { errors: @checklist.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @checklist.destroy
        head :no_content
      end

      private

      def set_project
        @project = current_user.projects.find(params[:project_id])
      end

      def set_checklist
        @checklist = @project.checklists.find(params[:id])
      end

      def checklist_params
        params.require(:checklist).permit(:name, :description, :icon, :position)
      end
    end
  end
end
