# Clear existing data
Item.destroy_all
Checklist.destroy_all
Project.destroy_all

# --- Home Renovation ---
home = Project.create!(name: "Home Renovation", status: "in_progress")

kitchen = home.checklists.create!(name: "Kitchen Prep", description: "Prepare the kitchen for renovation", icon: "utensils", position: 1)
kitchen_items = [
  "Remove old countertops", "Disconnect plumbing", "Remove cabinet doors",
  "Cover floors with protective sheets", "Set up temporary kitchen area",
  "Order new countertop materials", "Schedule plumber visit", "Empty all cabinets"
]
kitchen_items.each_with_index do |text, i|
  kitchen.items.create!(text: text, position: i + 1, completed: i < 6, completed_via: i < 6 ? "manual" : nil, completed_at: i < 6 ? Time.current : nil)
end

living = home.checklists.create!(name: "Living Room Paint", description: "Paint the living room walls", icon: "paint-roller", position: 2)
living_items = [
  "Choose paint colors", "Buy paint supplies", "Move furniture to center",
  "Tape edges and trim", "Apply primer coat", "Sand primer",
  "Apply first color coat", "Apply second color coat", "Paint trim",
  "Remove tape", "Touch up spots", "Move furniture back"
]
living_items.each_with_index do |text, i|
  living.items.create!(text: text, position: i + 1, completed: i < 3, completed_via: i < 3 ? "manual" : nil, completed_at: i < 3 ? Time.current : nil)
end

electrical = home.checklists.create!(name: "Electrical Rewiring", description: "Update electrical throughout the house", icon: "bolt", position: 3)
electrical_items = [
  "Get electrical inspection", "Hire licensed electrician", "Plan circuit layout",
  "Purchase supplies", "Turn off main breaker", "Remove old wiring from kitchen",
  "Remove old wiring from bathrooms", "Remove old wiring from bedrooms",
  "Install new circuit breaker panel", "Run new wiring to kitchen",
  "Run new wiring to bathrooms", "Run new wiring to bedrooms",
  "Install new outlets in kitchen", "Install new outlets in bathrooms",
  "Install new outlets in bedrooms", "Install GFCI outlets near water",
  "Install dimmer switches", "Install smart light switches",
  "Wire for ceiling fans", "Install smoke detectors",
  "Install carbon monoxide detectors", "Test all circuits",
  "Schedule final inspection", "Get occupancy approval"
]
electrical_items.each_with_index do |text, i|
  electrical.items.create!(text: text, position: i + 1, completed: i < 1, completed_via: i < 1 ? "manual" : nil, completed_at: i < 1 ? Time.current : nil)
end

# --- Weekly Chores ---
chores = Project.create!(name: "Weekly Chores", status: "in_progress")

["Laundry", "Grocery Shopping", "House Cleaning", "Yard Work", "Meal Prep"].each_with_index do |name, i|
  cl = chores.checklists.create!(name: name, description: "Weekly #{name.downcase} tasks", icon: "list-check", position: i + 1)
  5.times do |j|
    cl.items.create!(text: "#{name} task #{j + 1}", position: j + 1, completed: j < 2)
  end
end

# --- Client Prep ---
client = Project.create!(name: "Client Prep", status: "in_progress")

["Research & Discovery", "Proposal Draft", "Presentation Materials"].each_with_index do |name, i|
  cl = client.checklists.create!(name: name, description: "#{name} for client meeting", icon: "briefcase", position: i + 1)
  4.times do |j|
    cl.items.create!(text: "#{name} step #{j + 1}", position: j + 1, completed: j < 1)
  end
end

puts "Seeded: #{Project.count} projects, #{Checklist.count} checklists, #{Item.count} items"
