Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    frontend = ENV.fetch("FRONTEND_URL", "http://localhost:3000")
    origins frontend, "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
