module Api
  module V1
    class ItemsController < ApplicationController
      before_action :set_checklist
      before_action :set_item, only: [:update, :destroy]

      def index
        @items = @checklist.items.order(:position, :created_at)
        render json: @items
      end

      def create
        @item = @checklist.items.build(item_params)
        if @item.save
          render json: @item, status: :created
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @item.update(item_params)
          render json: @item
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @item.destroy
        head :no_content
      end

      private

      def set_checklist
        @checklist = Checklist.joins(project: :user)
                              .where(users: { id: current_user.id })
                              .find(params[:checklist_id])
      end

      def set_item
        @item = @checklist.items.find(params[:id])
      end

      def item_params
        params.require(:item).permit(:text, :completed, :completed_via, :completed_at, :position, :priority)
      end
    end
  end
end
