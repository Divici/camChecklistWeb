module Api
  module V1
    class AiController < ApplicationController
      before_action :set_checklist

      # POST /api/v1/checklists/:checklist_id/voice
      def voice
        transcript = params.require(:transcript)
        service = AiService.new(@checklist)
        result = service.process_voice(transcript)
        render json: result
      rescue ActionController::ParameterMissing, StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/checklists/:checklist_id/photo
      def photo
        unless params[:image].present?
          return render json: { error: "Image required" }, status: :unprocessable_entity
        end

        image_file = params[:image]
        image_data = Base64.strict_encode64(image_file.read)
        content_type = image_file.content_type

        service = AiService.new(@checklist)
        result = service.process_photo(image_data, content_type)
        render json: result
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/checklists/:checklist_id/ask
      def ask
        question = params.require(:question)
        service = AiService.new(@checklist)
        result = service.answer_question(question)
        render json: result
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_checklist
        @checklist = Checklist.includes(:items).find(params[:checklist_id])
      end
    end
  end
end
