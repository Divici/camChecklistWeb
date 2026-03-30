RSpec.shared_context "authenticated" do
  let(:current_user) { create(:user) }
  let(:auth_headers) { auth_headers_for(current_user) }
end
