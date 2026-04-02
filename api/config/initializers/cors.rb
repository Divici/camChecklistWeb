Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    frontend = ENV.fetch("FRONTEND_URL", "http://localhost:3000")
    origins frontend, "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"

    resource "*",
      headers: %w[Authorization Content-Type X-CSRF-Token Accept],
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      max_age: 3600
  end
end
