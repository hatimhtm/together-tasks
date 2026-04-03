import re

with open('src/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

# 1. Update the first query to use a join
content = content.replace(
    '.select("*")',
    '.select("*, partner:profiles!partner_id(id, theme, username, briefing_time, briefing_enabled, weekly_review_enabled)")'
)

# 2. Update self-healing block
content = content.replace(
    ".select('id')",
    ".select('id, theme, username, briefing_time, briefing_enabled, weekly_review_enabled')"
)
content = content.replace(
    "currentProfile.partner_id = partnerProfile.id\n        }",
    "currentProfile.partner_id = partnerProfile.id\n          currentProfile.partner = partnerProfile\n        }"
)

# 3. Update the second query block
old_second_query = """      let pTheme = "daylight"
      if (currentProfile?.partner_id) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("theme, username, briefing_time, briefing_enabled, weekly_review_enabled")
          .eq("id", currentProfile.partner_id)
          .single()
        if (partnerProfile?.theme) pTheme = partnerProfile.theme
        if (partnerProfile?.username) setPartnerName(partnerProfile.username)
      }"""

new_second_query = """      let pTheme = "daylight"
      if (currentProfile?.partner) {
        if (currentProfile.partner.theme) pTheme = currentProfile.partner.theme
        if (currentProfile.partner.username) setPartnerName(currentProfile.partner.username)
      }"""

content = content.replace(old_second_query, new_second_query)

with open('src/app/(dashboard)/page.tsx', 'w') as f:
    f.write(content)

print("Patched src/app/(dashboard)/page.tsx")
