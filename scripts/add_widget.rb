#!/usr/bin/env ruby
# Programmatically adds the TheAnvilWidget extension target to the Xcode project.
# Run once per build (idempotent - skips if target already exists).

require 'xcodeproj'

PROJECT   = 'ios/App/App.xcodeproj'
WIDGET    = 'TheAnvilWidget'
BUNDLE_ID = 'app.theanvil.widget'

project = Xcodeproj::Project.open(PROJECT)
main_target = project.targets.find { |t| t.name == 'App' }

if project.targets.any? { |t| t.name == WIDGET }
  puts "✓ #{WIDGET} target already exists — skipping"
  exit 0
end

# ── 0. Add WidgetPlugin.swift to main App target (idempotent) ────────────────
plugin_file = 'App/WidgetPlugin.swift'
already_in_project = main_target.source_build_phase.files.any? do |f|
  f.file_ref&.path&.end_with?('WidgetPlugin.swift')
end
unless already_in_project
  app_group = project.main_group.find_subpath('App', false) ||
              project.main_group.groups.find { |g| g.name == 'App' || g.path == 'App' }
  if app_group
    plugin_ref = app_group.new_file('WidgetPlugin.swift')
    plugin_ref.last_known_file_type = 'sourcecode.swift'
    main_target.source_build_phase.add_file_reference(plugin_ref)
    puts "✓ WidgetPlugin.swift added to App target"
  else
    puts "⚠ App group not found — WidgetPlugin.swift not added (plugin will be missing at runtime)"
  end
end

# ── 1. Create the extension target ───────────────────────────────────────────
widget_target = project.new_target(:app_extension, WIDGET, :ios, '17.0')

# ── 2. Create a file group pointing at ios/App/TheAnvilWidget/ ───────────────
widget_group = project.main_group.new_group(WIDGET, WIDGET)

# ── 3. Add Swift source file ─────────────────────────────────────────────────
swift_ref = widget_group.new_file('TheAnvilWidget.swift')
swift_ref.last_known_file_type = 'sourcecode.swift'
widget_target.source_build_phase.add_file_reference(swift_ref)

# ── 3b. Link WidgetKit + SwiftUI frameworks to the widget target ─────────────
['WidgetKit', 'SwiftUI'].each do |fw_name|
  fw_path = "System/Library/Frameworks/#{fw_name}.framework"
  existing = project.frameworks_group.files.find { |f| f.path == fw_path }
  fw_ref = existing || project.frameworks_group.new_reference(fw_path)
  unless existing
    fw_ref.name            = "#{fw_name}.framework"
    fw_ref.source_tree     = 'SDKROOT'
    fw_ref.last_known_file_type = 'wrapper.framework'
  end
  widget_target.frameworks_build_phase.add_file_reference(fw_ref)
end

# ── 4. Configure build settings for the widget target ────────────────────────
widget_target.build_configurations.each do |cfg|
  cfg.build_settings['PRODUCT_NAME']                          = WIDGET
  cfg.build_settings['PRODUCT_BUNDLE_IDENTIFIER']             = BUNDLE_ID
  cfg.build_settings['INFOPLIST_FILE']                        = "#{WIDGET}/Info.plist"
  cfg.build_settings['CODE_SIGN_ENTITLEMENTS']                = "#{WIDGET}/TheAnvilWidget.entitlements"
  cfg.build_settings['SWIFT_VERSION']                         = '5.0'
  cfg.build_settings['IPHONEOS_DEPLOYMENT_TARGET']            = '17.0'
  cfg.build_settings['TARGETED_DEVICE_FAMILY']                = '1,2'
  cfg.build_settings['SKIP_INSTALL']                          = 'YES'
  cfg.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'NO'
  cfg.build_settings['APPLICATION_EXTENSION_API_ONLY']        = 'YES'
end

# ── 5. Point main app at its entitlements ───────────────────────────────────
main_target.build_configurations.each do |cfg|
  cfg.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
end

# ── 6. Embed the widget extension inside the main app ────────────────────────
embed_phase = project.new(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
embed_phase.name = 'Embed Foundation Extensions'
embed_phase.dst_subfolder_spec = '13'   # PlugIns folder
main_target.build_phases << embed_phase

embed_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
embed_file.file_ref = widget_target.product_reference
embed_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
embed_phase.files << embed_file

# ── 7. Make main app depend on widget (builds widget first) ─────────────────
dep = project.new(Xcodeproj::Project::Object::PBXTargetDependency)
dep.target = widget_target
main_target.dependencies << dep

# ── 8. Add widget .appex to Products group ───────────────────────────────────
products_group = project.groups.find { |g| g.name == 'Products' }
products_group&.children&.push(widget_target.product_reference)

project.save
puts "✓ #{WIDGET} target added to #{PROJECT}"
